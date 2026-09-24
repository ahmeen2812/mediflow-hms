import uuid
from datetime import datetime, date
from sqlalchemy import String, ForeignKey, Text, Float, Integer, DateTime, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# ============================================================
# 1. MEDICATION CATALOG (Hospital Formulary)
# ============================================================
class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True) # e.g. MED-001
    
    brand_name: Mapped[str] = mapped_column(String(255), index=True)      # e.g. Norvasc, Augmentin, Glucophage
    generic_name: Mapped[str] = mapped_column(String(255), index=True)    # e.g. Amlodipine, Amoxicillin + Clavulanate
    category: Mapped[str] = mapped_column(String(100), index=True)        # Cardiovascular, Antibiotics, etc.
    
    strength: Mapped[str] = mapped_column(String(100))                     # e.g. 5mg, 625mg, 500mg
    dosage_form: Mapped[str] = mapped_column(String(100))                  # Tablet, Capsule, Syrup, Inhaler
    unit_price: Mapped[float] = mapped_column(Float, default=10.0)         # Price per unit
    
    current_stock: Mapped[int] = mapped_column(Integer, default=100)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=30)
    
    batch_number: Mapped[str] = mapped_column(String(100), default="BATCH-2026-A")
    expiry_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transactions: Mapped[list["StockTransaction"]] = relationship(
        "StockTransaction", 
        back_populates="medication", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )


# ============================================================
# 2. STOCK TRANSACTION LEDGER (Immutable Audit Trail)
# ============================================================
class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medication_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    
    # Types: dispense, restock, adjustment, return
    transaction_type: Mapped[str] = mapped_column(String(50), index=True)
    quantity_changed: Mapped[int] = mapped_column(Integer) # Negative for dispense, positive for restock
    balance_after: Mapped[int] = mapped_column(Integer)
    
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True) # e.g. RX-000001
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    medication: Mapped["Medication"] = relationship("Medication", back_populates="transactions")