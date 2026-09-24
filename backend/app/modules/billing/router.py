from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload, selectinload
import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.modules.billing.models import Charge, Invoice, InvoiceItem, Payment, WalletTransaction
from app.modules.patients.models import Patient
from app.modules.encounters.models import Encounter, LabOrder, Prescription

router = APIRouter(prefix="/billing", tags=["Billing, Invoicing & Patient Financial Ledger"])

# ============================================================
# SCHEMAS
# ============================================================
class WalletDepositPayload(BaseModel):
    amount: float
    payment_method: str = "cash" # cash, card, bank_transfer, corporate_approval
    approval_reference: Optional[str] = "ADMIN-APPROVED"
    notes: Optional[str] = "Advance medical deposit"

class GenerateInvoicePayload(BaseModel):
    discount: float = 0.0

class ProcessPaymentPayload(BaseModel):
    amount: float
    payment_method: str # cash, card, bank_transfer, wallet
    transaction_reference: Optional[str] = None
    cashier_notes: Optional[str] = "Outpatient cashier payment received."

# ============================================================
# 1. CASHIER OVERVIEW: UNBILLED CHARGES & INVOICES
# ============================================================
@router.get("/overview")
async def get_billing_overview(db: AsyncSession = Depends(get_db)):
    # 1. Fetch Invoices
    inv_res = await db.execute(
        select(Invoice)
        .options(joinedload(Invoice.patient), selectinload(Invoice.items), selectinload(Invoice.payments))
        .order_by(Invoice.created_at.desc())
    )
    invoices = inv_res.scalars().unique().all()

    # 2. Fetch Unbilled / Pending Charges grouped by patient
    charges_res = await db.execute(
        select(Charge)
        .options(joinedload(Charge.patient))
        .where(Charge.status == "pending")
        .order_by(Charge.created_at.desc())
    )
    pending_charges = charges_res.scalars().all()

    # 3. Overall Revenue Numbers
    total_rev_res = await db.execute(select(func.sum(Payment.amount_paid)))
    total_revenue = total_rev_res.scalar() or 0.0

    unpaid_total_res = await db.execute(select(func.sum(Invoice.balance_due)).where(Invoice.status != "paid"))
    unpaid_balance = unpaid_total_res.scalar() or 0.0

    return {
        "metrics": {
            "total_revenue": round(total_revenue, 2),
            "unpaid_balance": round(unpaid_balance, 2),
            "unpaid_invoices_count": len([i for i in invoices if i.status != "paid"]),
            "pending_charges_count": len(pending_charges)
        },
        "invoices": [
            {
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "patient_name": inv.patient.full_name if inv.patient else "Unknown",
                "patient_mrn": inv.patient.mrn if inv.patient else "N/A",
                "patient_id": str(inv.patient_id),
                "subtotal": inv.subtotal,
                "discount": inv.discount,
                "total_amount": inv.total_amount,
                "amount_paid": inv.amount_paid,
                "balance_due": inv.balance_due,
                "status": inv.status,
                "created_at": inv.created_at.strftime("%b %d, %Y - %I:%M %p"),
                "items_count": len(inv.items)
            }
            for inv in invoices
        ],
        "pending_charges": [
            {
                "id": str(c.id),
                "patient_id": str(c.patient_id),
                "patient_name": c.patient.full_name if c.patient else "Unknown",
                "patient_mrn": c.patient.mrn if c.patient else "N/A",
                "charge_type": c.charge_type,
                "service_name": c.service_name,
                "quantity": c.quantity,
                "unit_price": c.unit_price,
                "total_amount": c.total_amount,
                "reference_id": c.reference_id,
                "created_at": c.created_at.strftime("%b %d, %I:%M %p")
            }
            for c in pending_charges
        ]
    }

# ============================================================
# 2. PATIENT WALLET: DEPOSIT & ADVANCE BALANCE
# ============================================================
@router.get("/wallet/{patient_id}")
async def get_patient_wallet(patient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    tx_res = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.patient_id == patient_id)
        .order_by(WalletTransaction.created_at.desc())
    )
    txs = tx_res.scalars().all()

    # Calculate live balance from transactions if not cached
    current_balance = getattr(patient, "wallet_balance", 0.0) or 0.0

    return {
        "patient_id": str(patient.id),
        "patient_name": patient.full_name,
        "mrn": patient.mrn,
        "wallet_balance": round(current_balance, 2),
        "transactions": [
            {
                "id": str(t.id),
                "transaction_type": t.transaction_type,
                "amount": t.amount,
                "balance_after": t.balance_after,
                "payment_method": t.payment_method,
                "reference": t.reference,
                "notes": t.notes,
                "created_at": t.created_at.strftime("%b %d, %Y %I:%M %p")
            }
            for t in txs
        ]
    }

@router.post("/wallet/{patient_id}/deposit")
async def deposit_patient_wallet(patient_id: uuid.UUID, payload: WalletDepositPayload, db: AsyncSession = Depends(get_db)):
    try:
        patient = await db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")

        if payload.amount <= 0:
            raise HTTPException(status_code=400, detail="Deposit amount must be greater than zero.")

        # Update patient wallet balance
        current_bal = getattr(patient, "wallet_balance", 0.0) or 0.0
        new_balance = current_bal + payload.amount
        patient.wallet_balance = new_balance

        # Record ledger transaction
        tx = WalletTransaction(
            patient_id=patient.id,
            transaction_type="deposit",
            amount=payload.amount,
            balance_after=new_balance,
            payment_method=payload.payment_method,
            reference=payload.approval_reference or "CASHIER-DEP",
            notes=payload.notes or "Patient wallet advance credit deposit."
        )
        db.add(tx)
        await db.commit()

        return {
            "status": "success",
            "patient_name": patient.full_name,
            "deposited_amount": payload.amount,
            "new_wallet_balance": round(new_balance, 2),
            "message": f"Successfully credited ${payload.amount:.2f} to {patient.full_name}'s medical account."
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# 3. GENERATE ITEMIZED INVOICE FROM UNBILLED CHARGES
# ============================================================
@router.post("/invoices/generate/{patient_id}")
async def generate_invoice_for_patient(patient_id: uuid.UUID, payload: GenerateInvoicePayload, db: AsyncSession = Depends(get_db)):
    try:
        patient = await db.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")

        # Find all pending charges for this patient
        charges_res = await db.execute(
            select(Charge).where(and_(Charge.patient_id == patient_id, Charge.status == "pending"))
        )
        pending_charges = charges_res.scalars().all()

        if not pending_charges or len(pending_charges) == 0:
            raise HTTPException(status_code=400, detail="This patient has no pending charges to invoice.")

        # 1. Generate Invoice Number (INV-XXXXXX)
        count_res = await db.execute(select(func.count(Invoice.id)))
        inv_count = count_res.scalar() or 0
        inv_number = f"INV-{str(inv_count + 1).zfill(6)}"

        subtotal = sum(c.total_amount for c in pending_charges)
        total_due = max(0.0, subtotal - payload.discount)

        new_invoice = Invoice(
            invoice_number=inv_number,
            patient_id=patient.id,
            subtotal=subtotal,
            discount=payload.discount,
            total_amount=total_due,
            amount_paid=0.0,
            balance_due=total_due,
            status="unpaid"
        )
        db.add(new_invoice)
        await db.flush()

        # 2. Add Invoice Line Items and mark charges as invoiced
        for c in pending_charges:
            db.add(InvoiceItem(
                invoice_id=new_invoice.id,
                charge_id=c.id,
                description=c.service_name,
                category=c.charge_type.capitalize(),
                quantity=c.quantity,
                unit_price=c.unit_price,
                total_price=c.total_amount
            ))
            c.status = "invoiced"

        await db.commit()

        return {
            "status": "success",
            "invoice_number": new_invoice.invoice_number,
            "total_due": new_invoice.total_amount,
            "message": f"Invoice {new_invoice.invoice_number} generated with {len(pending_charges)} billable items."
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# 4. GET SINGLE INVOICE & PRINTABLE RECEIPT
# ============================================================
@router.get("/invoices/{invoice_id}")
async def get_invoice_details(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(Invoice)
        .options(joinedload(Invoice.patient), selectinload(Invoice.items), selectinload(Invoice.payments))
        .where(Invoice.id == invoice_id)
    )
    res = await db.execute(query)
    inv = res.scalars().unique().first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    return {
        "id": str(inv.id),
        "invoice_number": inv.invoice_number,
        "patient": {
            "id": str(inv.patient.id),
            "full_name": inv.patient.full_name,
            "mrn": inv.patient.mrn,
            "phone": inv.patient.phone,
            "address": inv.patient.address or "Outpatient Healthcare Colony",
            "wallet_balance": getattr(inv.patient, "wallet_balance", 0.0) or 0.0
        },
        "subtotal": inv.subtotal,
        "discount": inv.discount,
        "total_amount": inv.total_amount,
        "amount_paid": inv.amount_paid,
        "balance_due": inv.balance_due,
        "status": inv.status,
        "created_at": inv.created_at.strftime("%b %d, %Y - %I:%M %p"),
        "items": [
            {
                "description": it.description,
                "category": it.category,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total_price": it.total_price
            }
            for it in inv.items
        ],
        "payments": [
            {
                "payment_number": p.payment_number,
                "amount": p.amount_paid,
                "method": p.payment_method,
                "reference": p.transaction_reference,
                "date": p.recorded_at.strftime("%b %d, %Y %I:%M %p")
            }
            for p in inv.payments
        ]
    }

# ============================================================
# 5. PROCESS INVOICE PAYMENT (Cash, Card, Transfer, or Wallet!)
# ============================================================
@router.post("/invoices/{invoice_id}/payments")
async def process_invoice_payment(invoice_id: uuid.UUID, payload: ProcessPaymentPayload, db: AsyncSession = Depends(get_db)):
    try:
        inv = await db.get(Invoice, invoice_id)
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found.")
        if inv.status == "paid":
            raise HTTPException(status_code=400, detail="This invoice is already settled in full.")

        if payload.amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")
        if payload.amount > inv.balance_due:
            raise HTTPException(status_code=400, detail=f"Payment amount (${payload.amount:.2f}) exceeds remaining balance (${inv.balance_due:.2f}).")

        patient = await db.get(Patient, inv.patient_id)

        # IF PAYING VIA MEDICAL WALLET: Check and deduct wallet balance
        if payload.payment_method == "wallet":
            wallet_bal = getattr(patient, "wallet_balance", 0.0) or 0.0
            if wallet_bal < payload.amount:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient wallet balance. Available: ${wallet_bal:.2f}, Required: ${payload.amount:.2f}. Please deposit funds or choose Cash/Card."
                )
            
            # Deduct from wallet
            patient.wallet_balance = wallet_bal - payload.amount
            db.add(WalletTransaction(
                patient_id=patient.id,
                transaction_type="deduction",
                amount=-payload.amount,
                balance_after=patient.wallet_balance,
                payment_method="wallet",
                reference=inv.invoice_number,
                notes=f"Payment for invoice {inv.invoice_number}"
            ))

        # Generate Payment Number (PAY-XXXXXX)
        p_count_res = await db.execute(select(func.count(Payment.id)))
        p_count = p_count_res.scalar() or 0
        pay_number = f"PAY-{str(p_count + 1).zfill(6)}"

        # Record Payment
        new_payment = Payment(
            payment_number=pay_number,
            invoice_id=inv.id,
            patient_id=inv.patient_id,
            amount_paid=payload.amount,
            payment_method=payload.payment_method,
            transaction_reference=payload.transaction_reference or ("WALLET-DEDUCT" if payload.payment_method == "wallet" else "POS-CASHIER"),
            cashier_notes=payload.cashier_notes
        )
        db.add(new_payment)

        # Update Invoice Status & Balances
        inv.amount_paid += payload.amount
        inv.balance_due = max(0.0, inv.total_amount - inv.amount_paid)

        if inv.balance_due == 0:
            inv.status = "paid"
        else:
            inv.status = "partially_paid"

        await db.commit()

        return {
            "status": "success",
            "payment_number": new_payment.payment_number,
            "amount_paid": payload.amount,
            "remaining_balance": inv.balance_due,
            "invoice_status": inv.status,
            "message": f"Payment {new_payment.payment_number} successfully recorded."
        }
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))