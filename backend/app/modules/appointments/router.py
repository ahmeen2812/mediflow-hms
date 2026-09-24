from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.modules.appointments.models import Appointment, QueueEntry
from app.modules.doctors.models import Doctor
from app.modules.patients.models import Patient
from app.modules.billing.models import Charge, WalletTransaction, HospitalTreasury

router = APIRouter(prefix="/appointments", tags=["Appointments & Queue"])

class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_date: datetime
    reason: Optional[str] = None
    payment_method: str = "wallet" # "wallet" (auto-deduct from deposit) or "counter_cash"

class QueueStatusUpdate(BaseModel):
    status: str

# Helper to update Hospital Treasury Vault
async def credit_hospital_treasury(db: AsyncSession, amount: float, method: str):
    res = await db.execute(select(HospitalTreasury))
    treasury = res.scalars().first()
    if not treasury:
        treasury = HospitalTreasury()
        db.add(treasury)
        await db.flush()

    treasury.total_revenue_earned += amount
    if method == "cash":
        treasury.total_cash_in_drawer += amount
    elif method == "card":
        treasury.total_card_pos += amount
    elif method == "bank_transfer":
        treasury.total_bank_wire += amount
    elif method == "wallet":
        treasury.patient_deposits_held = max(0.0, treasury.patient_deposits_held - amount)

@router.get("/")
async def list_appointments(db: AsyncSession = Depends(get_db)):
    query = (
        select(Appointment)
        .options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.doctor).joinedload(Doctor.department)
        )
        .order_by(Appointment.appointment_date.desc())
    )
    result = await db.execute(query)
    appointments = result.scalars().unique().all()

    return [
        {
            "id": str(a.id),
            "appointment_number": a.appointment_number,
            "patient_name": a.patient.full_name if a.patient else "Unknown Patient",
            "patient_mrn": a.patient.mrn if a.patient else "N/A",
            "doctor_name": a.doctor.user.full_name if a.doctor and a.doctor.user else "Unknown Doctor",
            "department": a.doctor.department.name if a.doctor and a.doctor.department else "General Medicine",
            "appointment_date": a.appointment_date.isoformat() if a.appointment_date else "",
            "reason": a.reason or "General Outpatient Consultation",
            "consultation_fee": getattr(a, "consultation_fee", 50.0),
            "is_paid": getattr(a, "is_paid", True),
            "status": a.status or "scheduled"
        }
        for a in appointments
    ]

# ============================================================
# CREATE APPOINTMENT (With Upfront Fee Payment Check)
# ============================================================
@router.post("/")
async def create_appointment(data: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    try:
        app_date = data.appointment_date.replace(tzinfo=None) if data.appointment_date.tzinfo else data.appointment_date

        patient = await db.get(Patient, data.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Selected patient does not exist.")

        doctor = await db.get(Doctor, data.doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Selected doctor does not exist.")

        consultation_fee = 50.0 # Standard Doctor Consultation Fee

        # UPFRONT PAYMENT GATE: Check wallet balance if paying by wallet
        patient_bal = getattr(patient, "wallet_balance", 0.0) or 0.0
        if data.payment_method == "wallet":
            if patient_bal < consultation_fee:
                raise HTTPException(
                    status_code=400,
                    detail=f"Booking Blocked: Insufficient funds. Dr. {doctor.user.full_name}'s consultation fee is ${consultation_fee:.2f}, but patient wallet balance is only ${patient_bal:.2f}. Please deposit funds into patient medical account first."
                )
            
            # Deduct consultation fee from patient wallet
            patient.wallet_balance = patient_bal - consultation_fee
            db.add(WalletTransaction(
                patient_id=patient.id,
                transaction_type="consultation_fee",
                amount=-consultation_fee,
                balance_after=patient.wallet_balance,
                payment_method="wallet",
                reference="DOCTOR-BOOKING",
                notes=f"Consultation fee deduction for Dr. {doctor.user.full_name} ({doctor.department.name})"
            ))
            await credit_hospital_treasury(db, consultation_fee, "wallet")
            is_paid = True
        else:
            # Paid at front counter
            await credit_hospital_treasury(db, consultation_fee, "cash")
            is_paid = True

        # Conflict Check: Doctor cannot have overlapping appointments within 15 mins
        slot_start = app_date - timedelta(minutes=14)
        slot_end = app_date + timedelta(minutes=14)
        conflict_res = await db.execute(
            select(Appointment).where(
                and_(
                    Appointment.doctor_id == data.doctor_id,
                    Appointment.status.notin_(["cancelled", "no_show"]),
                    Appointment.appointment_date >= slot_start,
                    Appointment.appointment_date <= slot_end
                )
            )
        )
        if conflict_res.scalars().first():
            raise HTTPException(
                status_code=400,
                detail=f"Slot Conflict: Dr. {doctor.user.full_name} already has an appointment within this 15-minute slot."
            )

        # Generate AP-XXXXXX
        count_res = await db.execute(select(func.count(Appointment.id)))
        count = count_res.scalar() or 0
        app_num = f"AP-{str(count + 1).zfill(6)}"

        new_app = Appointment(
            appointment_number=app_num,
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            appointment_date=app_date,
            reason=data.reason.strip() if data.reason else "Outpatient Consultation",
            consultation_fee=consultation_fee,
            is_paid=is_paid,
            status="scheduled",
            created_at=datetime.utcnow()
        )
        db.add(new_app)

        # Record billable charge as settled
        db.add(Charge(
            patient_id=patient.id,
            charge_type="consultation",
            service_name=f"Consultation with Dr. {doctor.user.full_name} ({doctor.department.name})",
            unit_price=consultation_fee,
            quantity=1,
            total_amount=consultation_fee,
            status="paid",
            reference_id=app_num
        ))

        await db.commit()
        await db.refresh(new_app)

        return {
            "id": str(new_app.id),
            "appointment_number": new_app.appointment_number,
            "status": new_app.status,
            "fee_paid": consultation_fee,
            "remaining_wallet": getattr(patient, "wallet_balance", 0.0),
            "appointment_date": new_app.appointment_date.isoformat()
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Booking error: {str(e)}")

# ============================================================
# RECEPTION CHECK-IN (Crash-Proof Token Generation)
# ============================================================
@router.post("/{appointment_id}/check-in")
async def check_in_patient(appointment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        app = await db.get(Appointment, appointment_id)
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        if app.status == "cancelled":
            raise HTTPException(status_code=400, detail="Cancelled appointments cannot be checked in.")

        # Check if already in queue
        existing_queue = await db.execute(select(QueueEntry).where(QueueEntry.appointment_id == appointment_id))
        if existing_queue.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Patient is already checked in with an active queue token.")

        app.status = "checked_in"

        # Generate Crash-Proof Day-Specific Token (e.g. Q-2409-001)
        now_utc = datetime.utcnow()
        day_tag = now_utc.strftime("%d%m") # Day & Month
        today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        
        q_count_res = await db.execute(
            select(func.count(QueueEntry.id)).where(QueueEntry.checked_in_at >= today_start)
        )
        q_count = (q_count_res.scalar() or 0) + 1
        token = f"Q-{day_tag}-{str(q_count).zfill(3)}"

        new_queue_entry = QueueEntry(
            token_number=token,
            appointment_id=app.id,
            patient_id=app.patient_id,
            doctor_id=app.doctor_id,
            status="waiting",
            checked_in_at=datetime.utcnow()
        )
        db.add(new_queue_entry)
        await db.commit()

        return {
            "status": "success",
            "token_number": token,
            "message": f"Check-in successful! Assigned Token: {token}"
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Check-in error: {str(e)}")

# ============================================================
# LIVE QUEUE
# ============================================================
@router.get("/queue/live")
async def get_live_queue(db: AsyncSession = Depends(get_db)):
    query = (
        select(QueueEntry)
        .options(
            joinedload(QueueEntry.patient),
            joinedload(QueueEntry.doctor).joinedload(Doctor.user),
            joinedload(QueueEntry.doctor).joinedload(Doctor.department),
            joinedload(QueueEntry.appointment)
        )
        .order_by(QueueEntry.checked_in_at.asc())
    )
    res = await db.execute(query)
    entries = res.scalars().unique().all()

    now = datetime.utcnow()
    return [
        {
            "id": str(q.id),
            "token_number": q.token_number,
            "patient_name": q.patient.full_name if q.patient else "Unknown",
            "patient_mrn": q.patient.mrn if q.patient else "N/A",
            "doctor_name": q.doctor.user.full_name if q.doctor and q.doctor.user else "Staff Doctor",
            "department": q.doctor.department.name if q.doctor and q.doctor.department else "General Medicine",
            "status": q.status,
            "checked_in_at": q.checked_in_at.strftime("%I:%M %p"),
            "waiting_minutes": max(0, int((now - q.checked_in_at).total_seconds() // 60)),
            "appointment_number": q.appointment.appointment_number if q.appointment else "Walk-In",
            "appointment_id": str(q.appointment_id) if q.appointment_id else str(q.id)
        }
        for q in entries
    ]

@router.patch("/queue/{queue_id}/status")
async def update_queue_status(queue_id: uuid.UUID, payload: QueueStatusUpdate, db: AsyncSession = Depends(get_db)):
    entry = await db.get(QueueEntry, queue_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Queue record not found.")

    entry.status = payload.status
    if payload.status == "called":
        entry.called_at = datetime.utcnow()

    if entry.appointment_id:
        app = await db.get(Appointment, entry.appointment_id)
        if app:
            if payload.status == "with_doctor":
                app.status = "in_consultation"
            elif payload.status == "completed":
                app.status = "completed"
            elif payload.status == "no_show":
                app.status = "no_show"

    await db.commit()
    return {"status": "success", "new_status": payload.status}