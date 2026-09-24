import uuid
from sqlalchemy import String, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    doctors: Mapped[list["Doctor"]] = relationship("Doctor", back_populates="department", cascade="all, delete-orphan")

class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    user: Mapped["User"] = relationship("app.modules.auth.models.User", lazy="joined")

    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"))
    department: Mapped["Department"] = relationship("Department", back_populates="doctors", lazy="joined")
    
    specialization: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Fully declared relationship with selectin loading to prevent greenlet/mapper crashes
    schedules: Mapped[list["DoctorSchedule"]] = relationship(
        "DoctorSchedule", 
        back_populates="doctor", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True)
    
    day_of_week: Mapped[str] = mapped_column(String(20)) 
    start_time: Mapped[str] = mapped_column(String(10)) 
    end_time: Mapped[str] = mapped_column(String(10))   
    slot_duration: Mapped[int] = mapped_column(Integer, default=15)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="schedules")