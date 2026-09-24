import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# ============================================================
# 1. HOSPITAL CENTRAL TREASURY (Total Hospital Funds Vault)
# ============================================================
class HospitalTreasury(Base):
    __tablename__ = "hospital_treasury"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    total_cash_in_drawer: Mapped[float] = mapped_column(Float, default=0.0)
    total_card_pos: Mapped[float] = mapped_column(Float, default=0.0)
    total_bank_wire: Mapped[float] = mapped_column(Float, default=0.0)
    total_revenue_earned: Mapped[float] = mapped_column(Float, default=0.0)
    patient_deposits_held: Mapped[float] = mapped_column(Float, default=0.0)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ============================================================
# 2. PATIENT ADVANCE WALLET TRANSACTIONS
# ============================================================
class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    
    # Types: deposit, consultation_fee, lab_fee, pharmacy_fee, refund
    transaction_type: Mapped[str] = mapped_column(String(50), index=True)
    amount: Mapped[float] = mapped_column(Float) # Positive for deposit, negative for deductions
    balance_after: Mapped[float] = mapped_column(Float)
    payment_method: Mapped[str] = mapped_column(String(50), default="cash") # cash, card, bank_transfer, corporate_approval
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

# ============================================================
# 3. BILLABLE CHARGES
# ============================================================
class Charge(Base):
    __tablename__ = "charges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    
    charge_type: Mapped[str] = mapped_column(String(50), index=True) # consultation, laboratory, pharmacy
    service_name: Mapped[str] = mapped_column(String(255))
    unit_price: Mapped[float] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total_amount: Mapped[float] = mapped_column(Float)
    
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True) # pending, paid, invoiced
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient = relationship("app.modules.patients.models.Patient", lazy="joined")

# ============================================================
# 4. INVOICES & ITEMIZED LINES
# ============================================================
class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # INV-000001
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0)
    balance_due: Mapped[float] = mapped_column(Float, default=0.0)
    
    status: Mapped[str] = mapped_column(String(30), default="unpaid", index=True) # unpaid, partially_paid, paid
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", lazy="selectin")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan", lazy="selectin")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    charge_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("charges.id", ondelete="SET NULL"), nullable=True)
    
    description: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(50))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float)
    total_price: Mapped[float] = mapped_column(Float)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")

# ============================================================
# 5. PAYMENT TRANSACTIONS
# ============================================================
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # PAY-000001
    invoice_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    
    amount_paid: Mapped[float] = mapped_column(Float)
    payment_method: Mapped[str] = mapped_column(String(50)) # cash, card, bank_transfer, wallet
    transaction_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cashier_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")