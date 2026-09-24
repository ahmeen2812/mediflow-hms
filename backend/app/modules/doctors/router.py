from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload, selectinload
import uuid
from datetime import datetime
from app.core.database import get_db
from app.modules.auth.models import User, Role
from app.modules.doctors.models import Department, Doctor, DoctorSchedule
from app.modules.doctors.schemas import DoctorCreate, DoctorUpdate, DoctorResponse, DepartmentResponse, ScheduleSlot
from pwdlib import PasswordHash

router = APIRouter(prefix="/clinical", tags=["Doctor Management"])
password_hash = PasswordHash.recommended()

def format_doctor(d: Doctor) -> dict:
    now = datetime.now()
    current_day = now.strftime("%A")
    current_time = now.strftime("%H:%M")
    is_available = False

    if hasattr(d, "schedules") and d.schedules:
        for sch in d.schedules:
            if sch.is_active and sch.day_of_week.lower() == current_day.lower():
                if sch.start_time <= current_time <= sch.end_time:
                    is_available = True
                    break

    return {
        "id": d.id,
        "full_name": d.user.full_name if d.user else "Unknown Doctor",
        "email": d.user.email if d.user else "N/A",
        "specialization": d.specialization,
        "department_name": d.department.name if d.department else "General Medicine",
        "department_id": d.department_id,
        "bio": d.bio or "",
        "is_available": is_available,
    }

async def get_doctor_with_all_relations(doc_id: uuid.UUID, db: AsyncSession):
    query = (
        select(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.department),
            selectinload(Doctor.schedules)
        )
        .where(Doctor.id == doc_id)
    )
    res = await db.execute(query)
    return res.scalars().unique().first()

@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name.asc()))
    return result.scalars().all()

@router.get("/doctors", response_model=list[DoctorResponse])
async def list_doctors(db: AsyncSession = Depends(get_db)):
    query = (
        select(Doctor)
        .options(
            joinedload(Doctor.user),
            joinedload(Doctor.department),
            selectinload(Doctor.schedules)
        )
        .order_by(Doctor.specialization.asc())
    )
    result = await db.execute(query)
    doctors = result.scalars().unique().all()
    return [format_doctor(d) for d in doctors]

@router.get("/doctors/{doc_id}", response_model=DoctorResponse)
async def get_doctor_by_id(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doctor = await get_doctor_with_all_relations(doc_id, db)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return format_doctor(doctor)

@router.post("/doctors", response_model=DoctorResponse)
async def create_doctor(data: DoctorCreate, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Verify email uniqueness
        existing_user = await db.execute(select(User).where(User.email == data.email.lower().strip()))
        if existing_user.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="This email is already assigned to a staff account.")

        # 2. Get Doctor role
        role_res = await db.execute(select(Role).where(Role.name == "Doctor"))
        doc_role = role_res.scalar_one_or_none()
        if not doc_role:
            raise HTTPException(status_code=500, detail="Doctor system role is missing. Please run setup-db.")

        # 3. Create User account
        new_user = User(
            email=data.email.lower().strip(),
            full_name=data.full_name.strip(),
            hashed_password=password_hash.hash(data.password),
            role_id=doc_role.id,
            is_active=True
        )
        db.add(new_user)
        await db.flush()

        # 4. Create Doctor Profile
        new_doctor = Doctor(
            user_id=new_user.id,
            department_id=data.department_id,
            specialization=data.specialization.strip(),
            bio=data.bio.strip() if data.bio else None
        )
        db.add(new_doctor)
        await db.commit()

        # 5. Fetch clean committed record
        fresh_doctor = await get_doctor_with_all_relations(new_doctor.id, db)
        return format_doctor(fresh_doctor)

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/doctors/{doc_id}", response_model=DoctorResponse)
async def update_doctor(doc_id: uuid.UUID, data: DoctorUpdate, db: AsyncSession = Depends(get_db)):
    doctor = await get_doctor_with_all_relations(doc_id, db)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    if data.full_name is not None and doctor.user:
        doctor.user.full_name = data.full_name.strip()
    if data.specialization is not None:
        doctor.specialization = data.specialization.strip()
    if data.department_id is not None:
        doctor.department_id = data.department_id
    if data.bio is not None:
        doctor.bio = data.bio.strip()

    await db.commit()
    fresh_doc = await get_doctor_with_all_relations(doc_id, db)
    return format_doctor(fresh_doc)

@router.get("/doctors/{doc_id}/schedule")
async def get_doctor_schedule(doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DoctorSchedule)
        .where(DoctorSchedule.doctor_id == doc_id)
        .order_by(DoctorSchedule.day_of_week.asc())
    )
    schedules = res.scalars().all()
    return [
        {
            "id": str(s.id),
            "doctor_id": str(s.doctor_id),
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "slot_duration": s.slot_duration,
            "is_active": s.is_active,
        }
        for s in schedules
    ]

@router.post("/doctors/{doc_id}/schedule")
async def update_doctor_schedule(doc_id: uuid.UUID, schedules: list[dict], db: AsyncSession = Depends(get_db)):
    try:
        # Check doctor exists
        doctor = await db.get(Doctor, doc_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor does not exist.")

        # Delete old schedules
        await db.execute(delete(DoctorSchedule).where(DoctorSchedule.doctor_id == doc_id))
        await db.flush()

        # Insert new active/inactive schedule blocks
        for slot in schedules:
            new_slot = DoctorSchedule(
                doctor_id=doc_id,
                day_of_week=slot.get("day_of_week"),
                start_time=slot.get("start_time", "09:00"),
                end_time=slot.get("end_time", "17:00"),
                slot_duration=int(slot.get("slot_duration", 15)),
                is_active=bool(slot.get("is_active", True))
            )
            db.add(new_slot)

        await db.commit()
        return {"status": "success", "message": "Doctor schedule synchronized successfully."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))