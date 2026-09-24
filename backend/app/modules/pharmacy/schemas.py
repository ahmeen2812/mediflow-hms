from pydantic import BaseModel
import uuid
from datetime import date
from typing import Optional

class MedicationCreate(BaseModel):
    brand_name: str
    generic_name: str
    category: str
    strength: str
    dosage_form: str
    unit_price: float
    current_stock: int
    low_stock_threshold: int = 25
    batch_number: str
    expiry_date: date

class RestockPayload(BaseModel):
    quantity_added: int
    batch_number: Optional[str] = None
    notes: Optional[str] = "Routine pharmaceutical batch restock"

class DispensePayload(BaseModel):
    pharmacist_notes: Optional[str] = "Prescription verified and dispensed as instructed."