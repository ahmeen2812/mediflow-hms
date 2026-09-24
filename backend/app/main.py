from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, text
from datetime import date, datetime
from app.core.database import engine, Base, SessionLocal
from pwdlib import PasswordHash

# ============================================================
# 1. IMPORT ALL DATABASE MODELS
# ============================================================
from app.modules.auth.models import User, Role
from app.modules.patients.models import Patient
from app.modules.doctors.models import Department, Doctor, DoctorSchedule
from app.modules.appointments.models import Appointment, QueueEntry
from app.modules.encounters.models import (
    Encounter, 
    Vitals, 
    Prescription, 
    PrescriptionItem, 
    LabOrder, 
    LabOrderItem
)
from app.modules.laboratory.models import LabTestCatalog, LabResult
from app.modules.pharmacy.models import Medication, StockTransaction
from app.modules.billing.models import Charge, Invoice, InvoiceItem, Payment, WalletTransaction, HospitalTreasury

# ============================================================
# 2. IMPORT ALL API ROUTERS
# ============================================================
from app.modules.auth.router import router as auth_router
from app.modules.patients.router import router as patient_router
from app.modules.doctors.router import router as doctor_router
from app.modules.appointments.router import router as appointment_router
from app.modules.encounters.router import router as encounter_router
from app.modules.laboratory.router import router as laboratory_router
from app.modules.pharmacy.router import router as pharmacy_router
from app.modules.billing.router import router as billing_router

password_hash = PasswordHash.recommended()
app = FastAPI(title="MediFlow Clinical Command Center", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Registrations
app.include_router(auth_router, prefix="/api/v1")
app.include_router(patient_router, prefix="/api/v1")
app.include_router(doctor_router, prefix="/api/v1")
app.include_router(appointment_router, prefix="/api/v1")
app.include_router(encounter_router, prefix="/api/v1")
app.include_router(laboratory_router, prefix="/api/v1")
app.include_router(pharmacy_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"system": "MediFlow HMS", "status": "Operational", "version": "1.0.0"}

@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "service": "MediFlow Backend"}

# ============================================================
# 3. IDEMPOTENT DATABASE SETUP & SEED ENGINE (Crash-Proof)
# ============================================================
@app.get("/api/v1/setup-db")
async def setup_db():
    try:
        # Step A: Ensure Tables and Missing Columns
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_fee FLOAT DEFAULT 50.0;"))
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS wallet_balance FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_token_number_key;"))

        async with SessionLocal() as db:
            # Step B: Hospital Central Treasury Vault
            treasury_check = await db.execute(select(HospitalTreasury))
            treasury = treasury_check.scalars().first()
            if not treasury:
                db.add(HospitalTreasury(
                    total_cash_in_drawer=5000.0,
                    total_card_pos=3200.0,
                    total_bank_wire=12000.0,
                    total_revenue_earned=20200.0,
                    patient_deposits_held=1500.0
                ))
                await db.commit()

            # Step C: Seed Roles (Check by Unique Name)
            roles = ["Admin", "Doctor", "Receptionist", "Nurse", "Lab Technician", "Pharmacist", "Cashier"]
            for r_name in roles:
                check = await db.execute(select(Role).where(Role.name == r_name))
                if not check.scalar_one_or_none():
                    db.add(Role(name=r_name))
            await db.commit()

            # Step D: Seed Departments (Check by Unique Name)
            depts = [
                {"name": "Cardiology", "description": "Cardiovascular medicine and surgical evaluation"},
                {"name": "General Medicine", "description": "Primary healthcare and outpatient clinical diagnostics"},
                {"name": "Pediatrics", "description": "Infant, child, and adolescent healthcare"},
                {"name": "Orthopedics", "description": "Musculoskeletal system, joints, and spine"},
                {"name": "Dermatology", "description": "Clinical and procedural dermatological care"}
            ]
            for d in depts:
                check = await db.execute(select(Department).where(Department.name == d["name"]))
                if not check.scalar_one_or_none():
                    db.add(Department(**d))
            await db.commit()

            # Step E: Seed System Admin (Check by Unique Email)
            admin_email = "admin@mediflow.com"
            check_admin = await db.execute(select(User).where(User.email == admin_email))
            if not check_admin.scalar_one_or_none():
                admin_role = (await db.execute(select(Role).where(Role.name == "Admin"))).scalar_one()
                db.add(User(
                    email=admin_email,
                    full_name="System Administrator",
                    hashed_password=password_hash.hash("admin123"),
                    role_id=admin_role.id,
                    is_active=True
                ))
                await db.commit()

            # Step F: Seed Doctor (Dr. Sarah Ahmed) + Active Weekly Schedule
            doc_email = "doctor@mediflow.com"
            check_doc = await db.execute(select(User).where(User.email == doc_email))
            doc_user = check_doc.scalar_one_or_none()

            if not doc_user:
                doc_role = (await db.execute(select(Role).where(Role.name == "Doctor"))).scalar_one()
                cardio_dept = (await db.execute(select(Department).where(Department.name == "Cardiology"))).scalar_one()
                
                doc_user = User(
                    email=doc_email,
                    full_name="Dr. Sarah Ahmed",
                    hashed_password=password_hash.hash("doctor123"),
                    role_id=doc_role.id,
                    is_active=True
                )
                db.add(doc_user)
                await db.flush()

                new_doc = Doctor(
                    user_id=doc_user.id,
                    department_id=cardio_dept.id,
                    specialization="Interventional Cardiology",
                    bio="Lead Consultant in Cardiovascular Therapeutics and Outpatient Care."
                )
                db.add(new_doc)
                await db.flush()

                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                for day in days:
                    db.add(DoctorSchedule(
                        doctor_id=new_doc.id,
                        day_of_week=day,
                        start_time="08:00",
                        end_time="22:00",
                        slot_duration=15,
                        is_active=True
                    ))
                await db.commit()

            # Step G: Seed Patient by UNIQUE MRN (Permanent Fix for UniqueViolationError)
            pt_check = await db.execute(select(Patient).where(Patient.mrn == "PT-000001"))
            existing_patient = pt_check.scalars().first()

            if not existing_patient:
                # Insert fresh patient if PT-000001 does not exist
                new_pt = Patient(
                    mrn="PT-000001",
                    full_name="Ahmed Khan",
                    date_of_birth=date(1988, 5, 14),
                    gender="Male",
                    phone="+92 300 1234567",
                    email="ahmed.khan@example.com",
                    address="Suite 402, Medical City Colony, Lahore",
                    emergency_contact_name="Farhan Khan",
                    emergency_contact_phone="+92 321 7654321",
                    wallet_balance=250.0  # Funded prepaid balance ($250.00 / Rs. 12,500)
                )
                db.add(new_pt)
                await db.flush()
                
                db.add(WalletTransaction(
                    patient_id=new_pt.id,
                    transaction_type="deposit",
                    amount=250.0,
                    balance_after=250.0,
                    payment_method="corporate_approval",
                    reference="INITIAL-DEPOSIT",
                    notes="Approved initial medical fund allocation."
                ))
                await db.commit()
            else:
                # If PT-000001 already exists, update name and guarantee it has wallet funds
                existing_patient.full_name = "Ahmed Khan"
                if getattr(existing_patient, "wallet_balance", 0.0) < 250.0:
                    existing_patient.wallet_balance = 250.0
                await db.commit()

            # Step H: Seed Medications Formulary (Check by Unique Code)
            formulary = [
                {"code": "MED-0001", "brand_name": "Norvasc", "generic_name": "Amlodipine", "category": "Cardiovascular", "strength": "5mg", "dosage_form": "Tablet", "unit_price": 8.50, "current_stock": 250, "low_stock_threshold": 40, "batch_number": "B-NOR-901", "expiry_date": date(2028, 6, 30)},
                {"code": "MED-0002", "brand_name": "Lipitor", "generic_name": "Atorvastatin", "category": "Cardiovascular", "strength": "20mg", "dosage_form": "Tablet", "unit_price": 14.00, "current_stock": 180, "low_stock_threshold": 30, "batch_number": "B-LIP-442", "expiry_date": date(2028, 4, 15)},
                {"code": "MED-0003", "brand_name": "Lopressor", "generic_name": "Metoprolol Tartrate", "category": "Cardiovascular", "strength": "50mg", "dosage_form": "Tablet", "unit_price": 6.20, "current_stock": 120, "low_stock_threshold": 30, "batch_number": "B-LOP-118", "expiry_date": date(2027, 11, 20)},
                {"code": "MED-0004", "brand_name": "Cozaar", "generic_name": "Losartan Potassium", "category": "Cardiovascular", "strength": "50mg", "dosage_form": "Tablet", "unit_price": 11.50, "current_stock": 95, "low_stock_threshold": 25, "batch_number": "B-COZ-504", "expiry_date": date(2028, 1, 10)},
                {"code": "MED-0005", "brand_name": "Augmentin", "generic_name": "Amoxicillin + Clavulanate", "category": "Antibiotics", "strength": "625mg", "dosage_form": "Tablet", "unit_price": 22.00, "current_stock": 140, "low_stock_threshold": 40, "batch_number": "B-AUG-781", "expiry_date": date(2027, 8, 31)},
                {"code": "MED-0006", "brand_name": "Ciprobay", "generic_name": "Ciprofloxacin", "category": "Antibiotics", "strength": "500mg", "dosage_form": "Tablet", "unit_price": 16.50, "current_stock": 110, "low_stock_threshold": 25, "batch_number": "B-CIP-302", "expiry_date": date(2027, 10, 15)},
                {"code": "MED-0007", "brand_name": "Glucophage", "generic_name": "Metformin Hydrochloride", "category": "Endocrine", "strength": "500mg", "dosage_form": "Tablet", "unit_price": 4.50, "current_stock": 300, "low_stock_threshold": 50, "batch_number": "B-GLU-210", "expiry_date": date(2028, 9, 20)},
                {"code": "MED-0008", "brand_name": "Panadol", "generic_name": "Paracetamol", "category": "Analgesics", "strength": "500mg", "dosage_form": "Tablet", "unit_price": 2.00, "current_stock": 500, "low_stock_threshold": 100, "batch_number": "B-PAN-105", "expiry_date": date(2029, 5, 30)},
                {"code": "MED-0009", "brand_name": "Losec", "generic_name": "Omeprazole", "category": "Gastrointestinal", "strength": "20mg", "dosage_form": "Capsule", "unit_price": 12.00, "current_stock": 190, "low_stock_threshold": 35, "batch_number": "B-LOS-812", "expiry_date": date(2028, 3, 18)},
                {"code": "MED-0010", "brand_name": "Ventolin", "generic_name": "Salbutamol", "category": "Respiratory", "strength": "100mcg/dose", "dosage_form": "Inhaler", "unit_price": 28.00, "current_stock": 12, "low_stock_threshold": 15, "batch_number": "B-VEN-661", "expiry_date": date(2027, 6, 25)}
            ]

            for med_data in formulary:
                m_check = await db.execute(select(Medication).where(Medication.code == med_data["code"]))
                if not m_check.scalars().first():
                    m = Medication(**med_data)
                    db.add(m)
                    await db.flush()
                    db.add(StockTransaction(
                        medication_id=m.id,
                        transaction_type="restock",
                        quantity_changed=m.current_stock,
                        balance_after=m.current_stock,
                        reference_number="INITIAL-INTAKE",
                        notes="Hospital pharmacy formulary intake."
                    ))
            await db.commit()

        return {
            "status": "success",
            "message": "MediFlow HMS Enterprise Database 100% verified and synchronized."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}