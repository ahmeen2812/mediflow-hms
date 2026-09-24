import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, UserCheck, Plus, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface AppointmentItem {
  id: string;
  appointment_number: string;
  patient_name: string;
  patient_mrn: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  reason: string;
  status: string;
}

const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/appointments/');
      if (Array.isArray(res.data)) {
        setAppointments(res.data);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch appointments:", err);
      setError("Unable to connect to the appointments service. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCheckIn = async (appointmentId: string) => {
    setCheckingInId(appointmentId);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/appointments/${appointmentId}/check-in`);
      alert(`Patient checked in! Generated Queue Token: ${res.data.token_number}`);
      await fetchAppointments();
      navigate('/queue');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Check-in operation failed.";
      alert(`Check-in Error: ${errorMsg}`);
    } finally {
      setCheckingInId(null);
    }
  };

  const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-status-warning/10 text-status-warning border-status-warning/30">
            ● Checked In
          </span>
        );
      case 'in_consultation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-clinical-teal/10 text-clinical-teal border-clinical-teal/30">
            ✓ With Doctor
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-status-success/10 text-status-success border-status-success/30">
            ✓ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-status-critical/10 text-status-critical border-status-critical/30">
            ✕ Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-clinical-background text-clinical-muted border-clinical-border">
            ◷ Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Scheduled Appointments</h1>
          <p className="text-clinical-muted text-xs mt-1 font-medium">
            Outpatient bookings, doctor schedules, and reception check-in workflow.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchAppointments}
            className="flex items-center px-3.5 py-2 border border-clinical-border bg-white text-clinical-navy rounded-md text-xs font-bold hover:bg-clinical-background transition-colors"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link 
            to="/book-appointment" 
            className="flex items-center px-4 py-2 bg-clinical-blue text-white rounded-md text-xs font-bold hover:bg-clinical-navy transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-1.5" /> Book New Appointment
          </Link>
        </div>
      </div>

      {/* ERROR NOTICE IF BACKEND UNREACHABLE */}
      {error && (
        <div className="p-4 bg-status-critical/10 border border-status-critical/30 rounded-lg flex items-center text-status-critical text-xs font-semibold">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* APPOINTMENTS DATA TABLE */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[11px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3.5">Booking ID</th>
              <th className="px-6 py-3.5">Patient Details</th>
              <th className="px-6 py-3.5">Assigned Clinician</th>
              <th className="px-6 py-3.5">Scheduled Slot</th>
              <th className="px-6 py-3.5">Chief Complaint / Reason</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Reception Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-xs">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-clinical-background/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-clinical-blue whitespace-nowrap">
                  {a.appointment_number}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-clinical-navy text-sm">{a.patient_name}</p>
                  <p className="text-[11px] font-mono text-clinical-muted mt-0.5">MRN: {a.patient_mrn}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-clinical-text">{a.doctor_name}</p>
                  <p className="text-[11px] text-clinical-muted">{a.department}</p>
                </td>
                <td className="px-6 py-4 font-mono text-clinical-text whitespace-nowrap">
                  <div className="flex items-center text-clinical-text">
                    <Clock size={13} className="mr-1.5 text-clinical-muted" />
                    <span>{formatSafeDate(a.appointment_date)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-clinical-muted max-w-xs truncate">
                  {a.reason || "General Outpatient Consultation"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(a.status)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {a.status === 'scheduled' ? (
                    <button 
                      onClick={() => handleCheckIn(a.id)}
                      disabled={checkingInId === a.id}
                      className="inline-flex items-center px-3 py-1.5 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                    >
                      <UserCheck size={14} className="mr-1.5" />
                      {checkingInId === a.id ? "Checking In..." : "Check In"}
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-clinical-muted italic">
                      Token Issued
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* LOADING STATE */}
        {loading && (
          <div className="p-16 text-center text-clinical-muted text-xs font-semibold">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-clinical-blue" />
            Loading appointments registry...
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && appointments.length === 0 && !error && (
          <div className="p-16 text-center text-clinical-muted">
            <Calendar size={36} className="mx-auto mb-3 text-clinical-muted/40" />
            <p className="text-sm font-bold text-clinical-navy">No Appointments Scheduled</p>
            <p className="text-xs text-clinical-muted mt-1">Book an appointment for a registered patient to begin clinic intake.</p>
            <Link 
              to="/book-appointment" 
              className="inline-flex items-center px-4 py-2 mt-4 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors"
            >
              <Plus size={14} className="mr-1.5" /> Book First Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;