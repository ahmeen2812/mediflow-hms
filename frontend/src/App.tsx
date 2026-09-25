import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Screen
import LoginScreen from './features/auth/LoginScreen';

// Feature Views
import AdminDashboard from './features/dashboard/AdminDashboard';
import PatientList from './features/patients/PatientList';
import PatientRegistration from './features/patients/PatientRegistration';
import PatientProfile from './features/patients/PatientProfile';
import DoctorListAdmin from './features/dashboard/DoctorListAdmin';
import DoctorForm from './features/dashboard/DoctorForm';
import DoctorSchedule from './features/dashboard/DoctorSchedule';
import BookAppointment from './features/appointments/BookAppointment';
import AppointmentList from './features/appointments/AppointmentList';
import LiveQueue from './features/reception/LiveQueue';
import DoctorConsultation from './features/doctor/DoctorConsultation';
import LabDashboard from './features/laboratory/LabDashboard';
import LabResultEntry from './features/laboratory/LabResultEntry';
import PharmacyDashboard from './features/pharmacy/PharmacyDashboard';
import BillingDashboard from './features/billing/BillingDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* STANDALONE AUTHENTICATION ROUTE */}
        <Route path="/login" element={<LoginScreen />} />

        {/* PROTECTED CLINICAL COMMAND CENTER APP SHELL */}
        <Route
          path="/*"
          element={
            <DashboardLayout role="Admin">
              <Routes>
                {/* Main Command Center */}
                <Route path="/" element={<AdminDashboard />} />

                {/* Patient Management */}
                <Route path="/patients" element={<PatientList />} />
                <Route path="/register" element={<PatientRegistration />} />
                <Route path="/patients/:id" element={<PatientProfile />} />

                {/* Staff & Doctors */}
                <Route path="/staff/doctors" element={<DoctorListAdmin />} />
                <Route path="/staff/doctors/new" element={<DoctorForm />} />
                <Route path="/staff/doctors/edit/:id" element={<DoctorForm />} />
                <Route path="/staff/doctors/schedule/:id" element={<DoctorSchedule />} />

                {/* Appointments & Live Queue */}
                <Route path="/appointments" element={<AppointmentList />} />
                <Route path="/book-appointment" element={<BookAppointment />} />
                <Route path="/queue" element={<LiveQueue />} />

                {/* Clinical Consultation */}
                <Route path="/consultation/:appointmentId" element={<DoctorConsultation />} />

                {/* Laboratory Diagnostics */}
                <Route path="/laboratory" element={<LabDashboard />} />
                <Route path="/laboratory/entry/:orderId" element={<LabResultEntry />} />

                {/* Pharmacy Formulary & Dispensing */}
                <Route path="/pharmacy" element={<PharmacyDashboard />} />

                {/* Cashier, Invoicing & Financial Treasury */}
                <Route path="/billing" element={<BillingDashboard />} />

                {/* Catch-All Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;