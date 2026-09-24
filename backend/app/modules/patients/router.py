from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
from app.core.database import get_db
from app.modules.patients.models import Patient
from app.modules.patients.schemas import PatientCreate, PatientResponse
from app.modules.billing.models import WalletTransaction, HospitalTreasury

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/", response_model=list[PatientResponse])
async def list_patients(search: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Patient)
    if search:
        s = f"%{search}%"
        query = query.where(Patient.full_name.ilike(s) | Patient.mrn.ilike(s) | Patient.phone.ilike(s))
    result = await db.execute(query.order_by(Patient.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=PatientResponse)
async def create_patient(data: PatientCreate, db: AsyncSession = Depends(get_db)):
    # 1. Generate MRN (PT-000001)
    result = await db.execute(select(func.count(Patient.id)))
    count = result.scalar() or 0
    new_mrn = f"PT-{str(count + 1).zfill(6)}"

    deposit = max(0.0, float(data.initial_deposit or 0.0))
    patient_dict = data.model_dump(exclude={"initial_deposit"})

    # 2. Create Patient Record with initial wallet balance
    db_patient = Patient(
        **patient_dict,
        mrn=new_mrn,
        wallet_balance=deposit
    )
    db.add(db_patient)
    await db.flush()

    # 3. If initial deposit was made, credit hospital treasury and ledger
    if deposit > 0:
        db.add(WalletTransaction(
            patient_id=db_patient.id,
            transaction_type="deposit",
            amount=deposit,
            balance_after=deposit,
            payment_method="cash",
            reference="INTAKE-DEPOSIT",
            notes="Initial cash deposit at patient registration desk."
        ))
        
        treasury_res = await db.execute(select(HospitalTreasury))
        treasury = treasury_res.scalars().first()
        if treasury:
            treasury.total_cash_in_drawer += deposit
            treasury.patient_deposits_held += deposit

    await db.commit()
    await db.refresh(db_patient)
    return db_patient

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient