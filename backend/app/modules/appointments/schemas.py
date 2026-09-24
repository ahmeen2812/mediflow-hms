from pydantic import BaseModel
from datetime import datetime
import uuid

class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    appointment_date: datetime
    reason: str | None = None

class AppointmentResponse(BaseModel):
    id: uuid.UUID
    appointment_number: str
    status: str
    appointment_date: datetime
    class Config:
        from_attributes = True