export type AuthMode = 'signin' | 'register_request';

export type StaffRole = 
  | 'Doctor' 
  | 'Nurse' 
  | 'Lab Technician' 
  | 'Pharmacist' 
  | 'Cashier' 
  | 'Administrator';

export const ROLE_DEPARTMENTS: Record<StaffRole, string[]> = {
  Doctor: [
    'Cardiology',
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'Neurology'
  ],
  Nurse: [
    'Emergency & Triage Unit',
    'Intensive Care Unit (ICU)',
    'Inpatient Surgical Ward',
    'Pediatric Care Ward'
  ],
  'Lab Technician': [
    'Clinical Hematology',
    'Clinical Biochemistry',
    'Microbiology & Serology',
    'Pathology Division'
  ],
  Pharmacist: [
    'Central Outpatient Dispensary',
    'Inpatient Clinical Pharmacy'
  ],
  Cashier: [
    'Central Billing & Revenue Desk'
  ],
  Administrator: [
    'Hospital Executive Directorate',
    'Health Informatics & IT'
  ]
};