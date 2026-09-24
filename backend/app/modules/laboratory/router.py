from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
import uuid
from pydantic import BaseModel

from app.core.database import get_db
from app.modules.encounters.models import LabOrder, LabOrderItem
from app.modules.laboratory.models import LabResult, LabTestCatalog
from app.modules.doctors.models import Doctor

router = APIRouter(prefix="/laboratory", tags=["Laboratory Diagnostics & Results"])

# ============================================================
# SCHEMAS
# ============================================================
class ResultItemInput(BaseModel):
    parameter_name: str
    result_value: str
    unit: str
    reference_range: str
    flag: str = "normal"
    notes: str | None = None

class SubmitResultsPayload(BaseModel):
    technician_notes: str | None = None
    results: list[ResultItemInput]

class StatusUpdatePayload(BaseModel):
    status: str # sample_collected, processing, completed

# ============================================================
# 1. LIST ALL LAB ORDERS
# ============================================================
@router.get("/orders")
async def list_lab_orders(db: AsyncSession = Depends(get_db)):
    query = (
        select(LabOrder)
        .options(
            joinedload(LabOrder.patient),
            joinedload(LabOrder.doctor).joinedload(Doctor.user),
            joinedload(LabOrder.doctor).joinedload(Doctor.department),
            selectinload(LabOrder.items)
        )
        .order_by(LabOrder.created_at.desc())
    )
    res = await db.execute(query)
    orders = res.scalars().unique().all()

    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "patient_name": o.patient.full_name if o.patient else "Unknown Patient",
            "patient_mrn": o.patient.mrn if o.patient else "N/A",
            "doctor_name": o.doctor.user.full_name if o.doctor and o.doctor.user else "Attending Clinician",
            "department": o.doctor.department.name if o.doctor and o.doctor.department else "General Medicine",
            "status": o.status,
            "priority": o.priority,
            "created_at": o.created_at.strftime("%b %d, %Y - %I:%M %p"),
            "tests": [item.test_name for item in o.items]
        }
        for o in orders
    ]

# ============================================================
# 2. GET SINGLE ORDER DETAILS & TEMPLATES
# ============================================================
@router.get("/orders/{order_id}")
async def get_lab_order_details(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = (
        select(LabOrder)
        .options(
            joinedload(LabOrder.patient),
            joinedload(LabOrder.doctor).joinedload(Doctor.user),
            selectinload(LabOrder.items)
        )
        .where(LabOrder.id == order_id)
    )
    res = await db.execute(query)
    order = res.scalars().unique().first()

    if not order:
        raise HTTPException(status_code=404, detail="Lab order record not found.")

    results_res = await db.execute(select(LabResult).where(LabResult.lab_order_id == order_id))
    results = results_res.scalars().all()

    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "patient": {
            "id": str(order.patient.id) if order.patient else None,
            "full_name": order.patient.full_name if order.patient else "Unknown Patient",
            "mrn": order.patient.mrn if order.patient else "N/A",
            "gender": order.patient.gender if order.patient else "N/A"
        },
        "doctor_name": order.doctor.user.full_name if order.doctor and order.doctor.user else "Attending Clinician",
        "status": order.status,
        "priority": order.priority,
        "created_at": order.created_at.strftime("%b %d, %Y %I:%M %p"),
        "tests": [item.test_name for item in order.items],
        "existing_results": [
            {
                "parameter_name": r.parameter_name,
                "result_value": r.result_value,
                "unit": r.unit,
                "reference_range": r.reference_range,
                "flag": r.flag,
                "notes": r.notes
            }
            for r in results
        ]
    }

# ============================================================
# 3. ADVANCE SPECIMEN STATUS
# ============================================================
@router.patch("/orders/{order_id}/status")
async def update_lab_status(order_id: uuid.UUID, payload: StatusUpdatePayload, db: AsyncSession = Depends(get_db)):
    order = await db.get(LabOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = payload.status
    await db.commit()
    return {"status": "success", "new_status": order.status}

# ============================================================
# 4. SUBMIT & VERIFY DIAGNOSTIC RESULTS
# ============================================================
@router.post("/orders/{order_id}/results")
async def submit_lab_results(order_id: uuid.UUID, payload: SubmitResultsPayload, db: AsyncSession = Depends(get_db)):
    try:
        order = await db.get(LabOrder, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found.")

        # Remove prior draft results if any
        res_check = await db.execute(select(LabResult).where(LabResult.lab_order_id == order_id))
        for old_r in res_check.scalars().all():
            await db.delete(old_r)

        # Record new structured results
        for item in payload.results:
            db.add(LabResult(
                lab_order_id=order_id,
                parameter_name=item.parameter_name.strip(),
                result_value=item.result_value.strip(),
                unit=item.unit.strip(),
                reference_range=item.reference_range.strip(),
                flag=item.flag,
                notes=payload.technician_notes
            ))

        # Mark order completed
        order.status = "completed"
        await db.commit()

        return {
            "status": "success", 
            "message": f"Diagnostic results for {order.order_number} verified and released."
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to record results: {str(e)}")