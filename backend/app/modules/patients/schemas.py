from pydantic import BaseModel, EmailStr
from datetime import date
import uuid
from typing import Optional

class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    initial_deposit: Optional[float] = 0.0  # Optional advance deposit at registration!

class PatientResponse(BaseModel):
    id: uuid.UUID
    mrn: str
    full_name: str
    date_of_birth: date
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    wallet_balance: float = 0.0

    class Config:
        from_attributes = True