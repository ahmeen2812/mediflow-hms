import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
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
      <DashboardLayout role="Admin">
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<AdminDashboard />} />

          {/* Patient Management */}
          <Route path="/patients" element={<PatientList />} />
          <Route path="/register" element={<PatientRegistration />} />
          <Route path="/patients/:id" element={<PatientProfile />} />

          {/* Doctors & Staff */}
          <Route path="/staff/doctors" element={<DoctorListAdmin />} />
          <Route path="/staff/doctors/new" element={<DoctorForm />} />
          <Route path="/staff/doctors/edit/:id" element={<DoctorForm />} />
          <Route path="/staff/doctors/schedule/:id" element={<DoctorSchedule />} />

          {/* Appointments & Live Queue */}
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/queue" element={<LiveQueue />} />
          <Route path="/consultation/:appointmentId" element={<DoctorConsultation />} />
          {/* Finance & Billing */}
<Route path="/billing" element={<BillingDashboard />} />
{/* Laboratory Diagnostics */}
<Route path="/laboratory" element={<LabDashboard />} />
<Route path="/laboratory/entry/:orderId" element={<LabResultEntry />} />
{/* Pharmacy Operations */}
<Route path="/pharmacy" element={<PharmacyDashboard />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;