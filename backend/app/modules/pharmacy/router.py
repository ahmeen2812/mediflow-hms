from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload, selectinload
import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.modules.encounters.models import Prescription, PrescriptionItem
from app.modules.pharmacy.models import Medication, StockTransaction
from app.modules.pharmacy.schemas import MedicationCreate, RestockPayload, DispensePayload
from app.modules.doctors.models import Doctor
from app.modules.patients.models import Patient
from app.modules.billing.models import Charge, WalletTransaction, HospitalTreasury

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy Formulary & Prescription Dispensing"])

async def credit_hospital_treasury(db: AsyncSession, amount: float, method: str):
    res = await db.execute(select(HospitalTreasury))
    treasury = res.scalars().first()
    if not treasury:
        treasury = HospitalTreasury()
        db.add(treasury)
        await db.flush()

    treasury.total_revenue_earned += amount
    treasury.patient_deposits_held = max(0.0, treasury.patient_deposits_held - amount)

@router.get("/prescriptions")
async def get_prescription_queue(db: AsyncSession = Depends(get_db)):
    query = (
        select(Prescription)
        .options(
            joinedload(Prescription.patient),
            joinedload(Prescription.doctor).joinedload(Doctor.user),
            joinedload(Prescription.doctor).joinedload(Doctor.department),
            selectinload(Prescription.items)
        )
        .order_by(Prescription.created_at.desc())
    )
    res = await db.execute(query)
    prescriptions = res.scalars().unique().all()

    meds_res = await db.execute(select(Medication).where(Medication.is_active == True))
    all_meds = meds_res.scalars().all()

    queue = []
    for rx in prescriptions:
        items_detail = []
        is_all_in_stock = True
        total_prescription_cost = 0.0

        for item in rx.items:
            clean_item_name = item.medication_name.lower()
            matched_med = next(
                (m for m in all_meds if m.brand_name.lower() in clean_item_name or m.generic_name.lower() in clean_item_name),
                None
            )

            available = matched_med.current_stock if matched_med else 0
            has_stock = available >= item.quantity if matched_med else False
            if not has_stock:
                is_all_in_stock = False

            price = matched_med.unit_price if matched_med else 15.0
            total_prescription_cost += (price * item.quantity)

            items_detail.append({
                "id": str(item.id),
                "medication_name": item.medication_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration": item.duration,
                "quantity_prescribed": item.quantity,
                "matched_medication_id": str(matched_med.id) if matched_med else None,
                "stock_available": available,
                "in_stock": has_stock,
                "unit_price": price,
                "line_total": price * item.quantity
            })

        patient_wallet = getattr(rx.patient, "wallet_balance", 0.0) or 0.0

        queue.append({
            "id": str(rx.id),
            "prescription_number": rx.prescription_number,
            "patient_name": rx.patient.full_name if rx.patient else "Unknown Patient",
            "patient_mrn": rx.patient.mrn if rx.patient else "N/A",
            "patient_wallet_balance": round(patient_wallet, 2),
            "total_cost": round(total_prescription_cost, 2),
            "has_sufficient_balance": patient_wallet >= total_prescription_cost,
            "doctor_name": rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Attending Clinician",
            "department": rx.doctor.department.name if rx.doctor and rx.doctor.department else "General Medicine",
            "status": rx.status,
            "created_at": rx.created_at.strftime("%b %d, %Y - %I:%M %p"),
            "is_all_in_stock": is_all_in_stock,
            "items": items_detail
        })

    return queue

# ============================================================
# DISPENSE PRESCRIPTION (Strict Balance Clearance & Cut)
# ============================================================
@router.post("/prescriptions/{rx_id}/dispense")
async def dispense_prescription(rx_id: uuid.UUID, payload: DispensePayload, db: AsyncSession = Depends(get_db)):
    try:
        query = (
            select(Prescription)
            .options(
                joinedload(Prescription.patient),
                selectinload(Prescription.items)
            )
            .where(Prescription.id == rx_id)
        )
        res = await db.execute(query)
        rx = res.scalars().unique().first()

        if not rx:
            raise HTTPException(status_code=404, detail="Prescription not found.")
        if rx.status == "dispensed":
            raise HTTPException(status_code=400, detail="This prescription has already been dispensed.")

        patient = rx.patient
        if not patient:
            raise HTTPException(status_code=404, detail="Patient record not linked to prescription.")

        meds_res = await db.execute(select(Medication).where(Medication.is_active == True))
        all_meds = meds_res.scalars().all()

        # 1. Calculate Total Medication Bill
        total_medication_cost = 0.0
        medications_to_decrement = []

        for item in rx.items:
            clean_name = item.medication_name.lower()
            matched_med = next(
                (m for m in all_meds if m.brand_name.lower() in clean_name or m.generic_name.lower() in clean_name),
                None
            )

            if not matched_med:
                raise HTTPException(status_code=400, detail=f"Medication '{item.medication_name}' is not in hospital inventory.")

            if matched_med.current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Out of Stock: {matched_med.brand_name} only has {matched_med.current_stock} units available (prescribed: {item.quantity})."
                )

            item_cost = matched_med.unit_price * item.quantity
            total_medication_cost += item_cost
            medications_to_decrement.append((matched_med, item))

        # 2. STRICT FINANCIAL CHECK: Patient MUST have enough money in their medical wallet
        current_wallet = getattr(patient, "wallet_balance", 0.0) or 0.0
        if current_wallet < total_medication_cost:
            raise HTTPException(
                status_code=400,
                detail=f"Dispensing Blocked: Patient has insufficient funds. Medication total is ${total_medication_cost:.2f}, but patient wallet balance is only ${current_wallet:.2f}. Please deposit funds into patient medical account first."
            )

        # 3. Deduct from patient wallet and write to Treasury
        patient.wallet_balance = current_wallet - total_medication_cost
        db.add(WalletTransaction(
            patient_id=patient.id,
            transaction_type="pharmacy_fee",
            amount=-total_medication_cost,
            balance_after=patient.wallet_balance,
            payment_method="wallet",
            reference=rx.prescription_number,
            notes=f"Automatic medication deduction for prescription {rx.prescription_number}"
        ))
        await credit_hospital_treasury(db, total_medication_cost, "wallet")

        # 4. Decrement Physical Stock & Write to Stock Ledger
        for matched_med, item in medications_to_decrement:
            matched_med.current_stock -= item.quantity
            db.add(StockTransaction(
                medication_id=matched_med.id,
                transaction_type="dispense",
                quantity_changed=-item.quantity,
                balance_after=matched_med.current_stock,
                reference_number=rx.prescription_number,
                notes=payload.pharmacist_notes or "Dispensed to outpatient after wallet payment clearance."
            ))

        rx.status = "dispensed"
        await db.commit()

        return {
            "status": "success",
            "prescription_number": rx.prescription_number,
            "amount_deducted": total_medication_cost,
            "remaining_wallet": round(patient.wallet_balance, 2),
            "message": f"Prescription {rx.prescription_number} verified. Paid ${total_medication_cost:.2f} via wallet. Inventory updated."
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Dispensing failure: {str(e)}")

# ============================================================
# FORMULARY INVENTORY
# ============================================================
@router.get("/inventory")
async def get_inventory(search: str | None = None, category: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Medication).where(Medication.is_active == True)

    if search:
        s = f"%{search}%"
        query = query.where(or_(Medication.brand_name.ilike(s), Medication.generic_name.ilike(s), Medication.code.ilike(s)))
    
    if category and category != "all":
        query = query.where(Medication.category == category)

    query = query.order_by(Medication.brand_name.asc())
    res = await db.execute(query)
    medications = res.scalars().all()

    return [
        {
            "id": str(m.id),
            "code": m.code,
            "brand_name": m.brand_name,
            "generic_name": m.generic_name,
            "category": m.category,
            "strength": m.strength,
            "dosage_form": m.dosage_form,
            "unit_price": m.unit_price,
            "current_stock": m.current_stock,
            "low_stock_threshold": m.low_stock_threshold,
            "is_low_stock": m.current_stock <= m.low_stock_threshold,
            "batch_number": m.batch_number,
            "expiry_date": m.expiry_date.isoformat(),
            "status": "low_stock" if m.current_stock <= m.low_stock_threshold else ("out_of_stock" if m.current_stock == 0 else "healthy")
        }
        for m in medications
    ]

@router.post("/inventory/{med_id}/restock")
async def restock_medication(med_id: uuid.UUID, payload: RestockPayload, db: AsyncSession = Depends(get_db)):
    med = await db.get(Medication, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    if payload.quantity_added <= 0:
        raise HTTPException(status_code=400, detail="Restock quantity must be positive.")

    med.current_stock += payload.quantity_added
    if payload.batch_number:
        med.batch_number = payload.batch_number

    db.add(StockTransaction(
        medication_id=med.id,
        transaction_type="restock",
        quantity_changed=payload.quantity_added,
        balance_after=med.current_stock,
        reference_number="BATCH-RESTOCK",
        notes=payload.notes or "Pharmacy restock batch addition."
    ))

    await db.commit()
    return {
        "status": "success",
        "new_stock": med.current_stock,
        "message": f"Successfully restocked {med.brand_name} (+{payload.quantity_added} units)."
    }