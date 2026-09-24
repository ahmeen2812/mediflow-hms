from pydantic import BaseModel, EmailStr
import uuid
from typing import Optional

class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    department_id: uuid.UUID
    specialization: str
    bio: Optional[str] = None

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    bio: Optional[str] = None

class DoctorResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    specialization: str
    department_name: str
    department_id: uuid.UUID
    bio: Optional[str] = None
    is_available: bool = False

    class Config:
        from_attributes = True

class ScheduleSlot(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    slot_duration: int = 15
    is_active: bool = True