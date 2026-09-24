import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Text, Integer, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# ============================================================
# 1. CLINICAL ENCOUNTER
# ============================================================
class Encounter(Base):
    __tablename__ = "encounters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # ENC-000001
    
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True)
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)

    chief_complaint: Mapped[str] = mapped_column(Text)
    history_of_present_illness: Mapped[str | None] = mapped_column(Text, nullable=True)
    physical_examination: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[str] = mapped_column(String(255), index=True)
    treatment_plan: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    doctor = relationship("app.modules.doctors.models.Doctor", lazy="joined")
    appointment = relationship("app.modules.appointments.models.Appointment", lazy="joined")
    vitals: Mapped["Vitals"] = relationship("Vitals", back_populates="encounter", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    prescriptions: Mapped[list["Prescription"]] = relationship("Prescription", back_populates="encounter", cascade="all, delete-orphan", lazy="selectin")
    lab_orders: Mapped[list["LabOrder"]] = relationship("LabOrder", back_populates="encounter", cascade="all, delete-orphan", lazy="selectin")


# ============================================================
# 2. PATIENT VITALS
# ============================================================
class Vitals(Base):
    __tablename__ = "vitals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"), unique=True)
    
    blood_pressure_systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blood_pressure_diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    oxygen_saturation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    encounter: Mapped["Encounter"] = relationship("Encounter", back_populates="vitals")


# ============================================================
# 3. PRESCRIPTION & ITEMS (With Direct Patient & Doctor Relations)
# ============================================================
class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # RX-000001
    
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"))

    status: Mapped[str] = mapped_column(String(30), default="issued", index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounter: Mapped["Encounter"] = relationship("Encounter", back_populates="prescriptions")
    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    doctor = relationship("app.modules.doctors.models.Doctor", lazy="joined")
    items: Mapped[list["PrescriptionItem"]] = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan", lazy="selectin")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"))
    
    medication_name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(100))
    route: Mapped[str] = mapped_column(String(50), default="Oral")
    frequency: Mapped[str] = mapped_column(String(100))
    duration: Mapped[str] = mapped_column(String(100))
    quantity: Mapped[int] = mapped_column(Integer, default=30)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="items")


# ============================================================
# 4. LABORATORY ORDERS & ITEMS (With Direct Patient & Doctor Relations)
# ============================================================
class LabOrder(Base):
    __tablename__ = "lab_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # LAB-000001
    
    encounter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("encounters.id", ondelete="CASCADE"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"))

    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    encounter: Mapped["Encounter"] = relationship("Encounter", back_populates="lab_orders")
    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    doctor = relationship("app.modules.doctors.models.Doctor", lazy="joined")
    items: Mapped[list["LabOrderItem"]] = relationship("LabOrderItem", back_populates="lab_order", cascade="all, delete-orphan", lazy="selectin")


class LabOrderItem(Base):
    __tablename__ = "lab_order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lab_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lab_orders.id", ondelete="CASCADE"))
    
    test_name: Mapped[str] = mapped_column(String(255))
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    lab_order: Mapped["LabOrder"] = relationship("LabOrder", back_populates="items")