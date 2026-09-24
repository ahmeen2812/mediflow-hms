import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_number: Mapped[str] = mapped_column(String(30), unique=True, index=True) # AP-000001
    
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True)
    
    appointment_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Financial status of appointment
    consultation_fee: Mapped[float] = mapped_column(Float, default=50.0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Statuses: scheduled, checked_in, in_consultation, completed, cancelled, no_show
    status: Mapped[str] = mapped_column(String(50), default="scheduled", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    doctor = relationship("app.modules.doctors.models.Doctor", lazy="joined")
    queue_entry = relationship("QueueEntry", back_populates="appointment", uselist=False, cascade="all, delete-orphan")

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # INDEXED (not globally unique) to eliminate the token collision crash
    token_number: Mapped[str] = mapped_column(String(30), index=True) # e.g. Q-2409-001
    
    appointment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"))

    # Statuses: waiting, called, with_doctor, completed, no_show
    status: Mapped[str] = mapped_column(String(30), default="waiting", index=True)
    checked_in_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    called_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    appointment = relationship("Appointment", back_populates="queue_entry")
    patient = relationship("app.modules.patients.models.Patient", lazy="joined")
    doctor = relationship("app.modules.doctors.models.Doctor", lazy="joined")