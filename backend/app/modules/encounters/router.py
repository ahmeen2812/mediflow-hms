from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
import uuid
from datetime import datetime

from app.core.database import get_db
from app.modules.encounters.models import Encounter, Vitals, Prescription, PrescriptionItem, LabOrder, LabOrderItem
from app.modules.encounters.schemas import EncounterCreate
from app.modules.appointments.models import Appointment, QueueEntry
from app.modules.patients.models import Patient
from app.modules.doctors.models import Doctor
from app.modules.billing.models import Charge
router = APIRouter(prefix="/encounters", tags=["Doctor Consultation & Clinical Encounters"])

# ============================================================
# 1. RESOLVE CONSULTATION SESSION (By Appointment or Queue ID)
# ============================================================
@router.get("/session/{target_id}")
async def get_consultation_session(target_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    # 1. Check if target_id is an Appointment
    app_res = await db.execute(
        select(Appointment)
        .options(
            joinedload(Appointment.patient),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
            joinedload(Appointment.doctor).joinedload(Doctor.department)
        )
        .where(Appointment.id == target_id)
    )
    app = app_res.scalars().unique().first()
    queue_entry = None

    # 2. If not appointment, check if target_id is a Queue Entry
    if not app:
        q_res = await db.execute(
            select(QueueEntry)
            .options(
                joinedload(QueueEntry.appointment),
                joinedload(QueueEntry.patient),
                joinedload(QueueEntry.doctor).joinedload(Doctor.user),
                joinedload(QueueEntry.doctor).joinedload(Doctor.department)
            )
            .where(QueueEntry.id == target_id)
        )
        queue_entry = q_res.scalars().unique().first()
        if queue_entry:
            app = queue_entry.appointment

    if not app and not queue_entry:
        raise HTTPException(status_code=404, detail="Consultation session could not be resolved for this ID.")

    patient = app.patient if app and app.patient else (queue_entry.patient if queue_entry else None)
    doctor = app.doctor if app and app.doctor else (queue_entry.doctor if queue_entry else None)

    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Patient or Doctor record missing for this clinical session.")

    return {
        "appointment_id": str(app.id) if app else None,
        "appointment_number": app.appointment_number if app else (queue_entry.token_number if queue_entry else "Walk-In"),
        "reason": app.reason if app else "Outpatient Clinical Consultation",
        "patient": {
            "id": str(patient.id),
            "full_name": patient.full_name,
            "mrn": patient.mrn,
            "gender": patient.gender,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else "",
            "phone": patient.phone,
            "email": patient.email or "N/A",
            "address": patient.address or "Medical Colony, Outpatient District",
            "emergency_contact_name": patient.emergency_contact_name or "Emergency Contact",
            "emergency_contact_phone": patient.emergency_contact_phone or "N/A",
        },
        "doctor": {
            "id": str(doctor.id),
            "full_name": doctor.user.full_name if doctor.user else "Attending Clinician",
            "department_name": doctor.department.name if doctor.department else "General Medicine",
            "specialization": doctor.specialization or "Consultant"
        }
    }

# ============================================================
# 2. CREATE & SIGN ENCOUNTER
# ============================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_encounter(data: EncounterCreate, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Generate Encounter ID (ENC-XXXXXX)
        count_res = await db.execute(select(func.count(Encounter.id)))
        enc_count = count_res.scalar() or 0
        enc_number = f"ENC-{str(enc_count + 1).zfill(6)}"

        # 2. Create Encounter
        new_enc = Encounter(
            encounter_number=enc_number,
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            appointment_id=data.appointment_id,
            chief_complaint=data.chief_complaint.strip(),
            history_of_present_illness=data.history_of_present_illness,
            physical_examination=data.physical_examination,
            diagnosis=data.diagnosis.strip(),
            treatment_plan=data.treatment_plan,
            status="completed",
            completed_at=datetime.utcnow()
        )
        db.add(new_enc)
        await db.flush()

        # 3. Attach Vitals
        if data.vitals:
            new_vitals = Vitals(
                encounter_id=new_enc.id,
                **data.vitals.model_dump()
            )
            db.add(new_vitals)

        # 4. Attach Prescriptions
        if data.prescriptions and len(data.prescriptions) > 0:
            rx_count_res = await db.execute(select(func.count(Prescription.id)))
            rx_count = rx_count_res.scalar() or 0
            rx_number = f"RX-{str(rx_count + 1).zfill(6)}"

            new_rx = Prescription(
                prescription_number=rx_number,
                encounter_id=new_enc.id,
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                status="issued"
            )
            db.add(new_rx)
            await db.flush()

            for item in data.prescriptions:
                db.add(PrescriptionItem(
                    prescription_id=new_rx.id,
                    **item.model_dump()
                ))

        # 5. Attach Lab Orders
        if data.lab_tests and len(data.lab_tests) > 0:
            lab_count_res = await db.execute(select(func.count(LabOrder.id)))
            lab_count = lab_count_res.scalar() or 0
            lab_number = f"LAB-{str(lab_count + 1).zfill(6)}"

            new_lab = LabOrder(
                order_number=lab_number,
                encounter_id=new_enc.id,
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                status="pending"
            )
            db.add(new_lab)
            await db.flush()

            for item in data.lab_tests:
                db.add(LabOrderItem(
                    lab_order_id=new_lab.id,
                    **item.model_dump()
                ))
            for item in data.lab_tests:
                db.add(LabOrderItem(
                    lab_order_id=new_lab.id,
                    **item.model_dump()
                ))
                # Auto-generate Billable Lab Charge ($25.00 each)
                db.add(Charge(
                    patient_id=data.patient_id,
                    charge_type="laboratory",
                    service_name=f"Lab Diagnostic: {item.test_name}",
                    unit_price=25.00,
                    quantity=1,
                    total_amount=25.00,
                    status="pending",
                    reference_id=lab_number
                ))
        # 6. Synchronize Appointment and Queue Token to Completed
        if data.appointment_id:
            app = await db.get(Appointment, data.appointment_id)
            if app:
                app.status = "completed"
            
            queue_res = await db.execute(select(QueueEntry).where(QueueEntry.appointment_id == data.appointment_id))
            queue_entry = queue_res.scalar_one_or_none()
            if queue_entry:
                queue_entry.status = "completed"

        await db.commit()

        return {
            "status": "success",
            "encounter_number": new_enc.encounter_number,
            "patient_id": str(new_enc.patient_id),
            "message": f"Clinical consultation {new_enc.encounter_number} signed and completed."
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Clinical error: {str(e)}")

# ============================================================
# 3. PATIENT LONGITUDINAL TIMELINE
# ============================================================
@router.get("/patient/{patient_id}/timeline")
async def get_patient_clinical_timeline(patient_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    enc_res = await db.execute(
        select(Encounter)
        .options(
            joinedload(Encounter.doctor).joinedload(Doctor.user),
            selectinload(Encounter.vitals),
            selectinload(Encounter.prescriptions).selectinload(Prescription.items),
            selectinload(Encounter.lab_orders).selectinload(LabOrder.items)
        )
        .where(Encounter.patient_id == patient_id)
        .order_by(Encounter.created_at.desc())
    )
    encounters = enc_res.scalars().unique().all()

    timeline = []
    for enc in encounters:
        doc_name = enc.doctor.user.full_name if enc.doctor and enc.doctor.user else "Attending Clinician"
        
        # Encounter Entry
        timeline.append({
            "type": "consultation",
            "title": f"Consultation with {doc_name}",
            "date": enc.created_at.strftime("%b %d, %Y"),
            "time": enc.created_at.strftime("%I:%M %p"),
            "badge": enc.encounter_number,
            "details": f"Diagnosis: {enc.diagnosis}. Chief Complaint: {enc.chief_complaint}",
            "vitals": {
                "bp": f"{enc.vitals.blood_pressure_systolic}/{enc.vitals.blood_pressure_diastolic}" if enc.vitals else None,
                "hr": f"{enc.vitals.heart_rate} bpm" if enc.vitals else None,
                "temp": f"{enc.vitals.temperature} °F" if enc.vitals else None,
                "spo2": f"{enc.vitals.oxygen_saturation}%" if enc.vitals else None
            } if enc.vitals else None
        })

        # Prescriptions Entry
        for rx in enc.prescriptions:
            meds_str = ", ".join([f"{item.medication_name} ({item.frequency})" for item in rx.items])
            timeline.append({
                "type": "prescription",
                "title": f"Prescription Issued ({rx.prescription_number})",
                "date": rx.created_at.strftime("%b %d, %Y"),
                "time": rx.created_at.strftime("%I:%M %p"),
                "badge": rx.status.upper(),
                "details": meds_str if meds_str else "Standard pharmaceutical orders."
            })

        # Lab Orders Entry
        for lab in enc.lab_orders:
            tests_str = ", ".join([item.test_name for item in lab.items])
            timeline.append({
                "type": "lab_order",
                "title": f"Diagnostics Ordered ({lab.order_number})",
                "date": lab.created_at.strftime("%b %d, %Y"),
                "time": lab.created_at.strftime("%I:%M %p"),
                "badge": lab.status.upper(),
                "details": f"Requested Tests: {tests_str}"
            })

    return timeline