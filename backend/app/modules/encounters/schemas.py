from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional

class VitalsInput(BaseModel):
    blood_pressure_systolic: Optional[int] = 120
    blood_pressure_diastolic: Optional[int] = 80
    heart_rate: Optional[int] = 72
    temperature: Optional[float] = 98.6
    respiratory_rate: Optional[int] = 16
    oxygen_saturation: Optional[int] = 98
    weight: Optional[float] = 70.0
    height: Optional[float] = 175.0

class PrescriptionItemInput(BaseModel):
    medication_name: str
    dosage: str = "1 tablet"
    route: str = "Oral"
    frequency: str = "Once daily"
    duration: str = "30 days"
    quantity: int = 30
    instructions: Optional[str] = "Take after meal"

class LabItemInput(BaseModel):
    test_name: str
    instructions: Optional[str] = None

class EncounterCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    chief_complaint: str
    history_of_present_illness: Optional[str] = None
    physical_examination: Optional[str] = None
    diagnosis: str
    treatment_plan: Optional[str] = None
    vitals: Optional[VitalsInput] = None
    prescriptions: Optional[list[PrescriptionItemInput]] = []
    lab_tests: Optional[list[LabItemInput]] = []