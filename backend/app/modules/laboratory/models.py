import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class LabTestCatalog(Base):
    __tablename__ = "lab_test_catalogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True) # e.g. CBC, LIPID, HBA1C
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100)) # Hematology, Biochemistry, etc.
    sample_type: Mapped[str] = mapped_column(String(100)) # Whole Blood, Serum, Urine
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[float] = mapped_column(Float, default=25.0)

class LabResult(Base):
    __tablename__ = "lab_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lab_orders.id", ondelete="CASCADE"), index=True)
    
    parameter_name: Mapped[str] = mapped_column(String(255)) # e.g. Hemoglobin, Total Cholesterol
    result_value: Mapped[str] = mapped_column(String(100))   # e.g. 14.5
    unit: Mapped[str] = mapped_column(String(50))           # e.g. g/dL, mg/dL
    reference_range: Mapped[str] = mapped_column(String(100)) # e.g. 13.5 - 17.5
    flag: Mapped[str] = mapped_column(String(20), default="normal") # normal, high, low, critical
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lab_order = relationship("app.modules.encounters.models.LabOrder", lazy="joined")