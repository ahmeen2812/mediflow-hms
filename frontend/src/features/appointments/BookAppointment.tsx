import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, User, Stethoscope, Save, Loader2, AlertCircle, Wallet, Check } from 'lucide-react';

interface PatientOption {
  id: string;
  full_name: string;
  mrn: string;
  wallet_balance?: number;
}

interface DoctorOption {
  id: string;
  full_name: string;
  department_name: string;
  specialization: string;
  is_available: boolean;
}

const BookAppointment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryPatientId = searchParams.get('patientId') || '';
  const queryPatientName = searchParams.get('name') || '';

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patient_id: queryPatientId,
    doctor_id: '',
    appointment_date: '',
    reason: '',
    payment_method: 'wallet' // 'wallet' or 'counter_cash'
  });

  const CONSULTATION_FEE = 50.0;

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [ptsRes, docsRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/v1/patients/'),
          axios.get('http://127.0.0.1:8000/api/v1/clinical/doctors')
        ]);
        
        const ptList = Array.isArray(ptsRes.data) ? ptsRes.data : [];
        const docList = Array.isArray(docsRes.data) ? docsRes.data : [];
        
        setPatients(ptList);
        setDoctors(docList);

        if (!queryPatientId && ptList.length > 0) {
          setFormData(prev => ({ ...prev, patient_id: ptList[0].id }));
        }
        if (docList.length > 0) {
          setFormData(prev => ({ ...prev, doctor_id: docList[0].id }));
        }
      } catch (err) {
        setErrorMessage("Could not load registered patients or physicians.");
      } finally {
        setLoadingInitial(false);
      }
    };
    loadPrerequisites();
  }, [queryPatientId]);

  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  const currentBalance = selectedPatient?.wallet_balance || 0.0;
  const hasSufficientFunds = currentBalance >= CONSULTATION_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.patient_id) {
      setErrorMessage("Please select a patient.");
      return;
    }
    if (!formData.doctor_id) {
      setErrorMessage("Please select an attending doctor.");
      return;
    }
    if (!formData.appointment_date) {
      setErrorMessage("Please select an appointment date and time.");
      return;
    }

    if (formData.payment_method === 'wallet' && !hasSufficientFunds) {
      setErrorMessage(`Insufficient Funds: Patient wallet has $${currentBalance.toFixed(2)}, but doctor fee is $${CONSULTATION_FEE.toFixed(2)}. Please deposit funds or choose 'Pay at Counter'.`);
      return;
    }

    setSubmitting(true);
    try {
      const formattedDate = formData.appointment_date.length === 16 
        ? `${formData.appointment_date}:00` 
        : formData.appointment_date;

      const payload = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        appointment_date: formattedDate,
        reason: formData.reason.trim() || "Outpatient Clinical Consultation",
        payment_method: formData.payment_method
      };

      const res = await axios.post('http://127.0.0.1:8000/api/v1/appointments/', payload);
      alert(`Booking Confirmed! Reference: ${res.data.appointment_number}. Fee of $${res.data.fee_paid.toFixed(2)} paid.`);
      navigate('/appointments');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Booking failed.";
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/appointments" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
          <ArrowLeft size={20} className="text-clinical-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Schedule Outpatient Appointment</h1>
          <p className="text-xs text-clinical-muted mt-0.5">
            Upfront consultation fee clearance and automated double-booking validation.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 mb-6 bg-status-critical/10 border border-status-critical/30 rounded-lg flex items-center text-status-critical text-xs font-semibold">
          <AlertCircle size={18} className="mr-2.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loadingInitial ? (
        <div className="p-20 text-center text-clinical-muted">
          <Loader2 className="animate-spin mx-auto mb-3 text-clinical-blue" size={30} />
          Loading clinical dependencies...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-clinical-border rounded-lg divide-y divide-clinical-border shadow-sm">
          {/* FINANCIAL CLEARANCE TAPE */}
          <div className="p-5 bg-clinical-blue/5 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-clinical-navy text-white rounded">
                <Wallet size={16} />
              </div>
              <div>
                <p className="font-bold text-clinical-navy">Patient Medical Wallet Balance:</p>
                <p className="text-base font-extrabold font-mono text-clinical-blue mt-0.5">
                  ${currentBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-clinical-muted">Doctor Consultation Fee:</p>
              <p className="text-sm font-extrabold text-clinical-navy font-mono">${CONSULTATION_FEE.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* PATIENT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest flex items-center">
                  <User size={12} className="mr-1" /> Select Patient
                </label>
                {queryPatientName ? (
                  <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-xs font-bold text-clinical-navy">
                    {queryPatientName} (Pre-selected)
                  </div>
                ) : (
                  <select 
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    required
                    className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue"
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.mrn}) • Bal: ${Number(p.wallet_balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* DOCTOR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest flex items-center">
                  <Stethoscope size={12} className="mr-1" /> Select Attending Physician
                </label>
                <select 
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  required
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue"
                >
                  <option value="">-- Choose Doctor & Specialty --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} • {d.department_name} ({d.specialization}) {d.is_available ? "● Available Now" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAYMENT OPTION */}
              <div className="space-y-1.5 pt-2 border-t border-clinical-border">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">
                  Consultation Fee Payment Method
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                    formData.payment_method === 'wallet' ? 'border-clinical-blue bg-clinical-blue/5' : 'border-clinical-border'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="wallet" 
                      checked={formData.payment_method === 'wallet'}
                      onChange={() => setFormData({ ...formData, payment_method: 'wallet' })}
                      className="mr-3"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-clinical-navy">Deduct from Medical Wallet ($50.00)</p>
                      <p className="text-[11px] text-clinical-muted">Instant balance cut. Available: ${currentBalance.toFixed(2)}</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${
                    formData.payment_method === 'counter_cash' ? 'border-clinical-blue bg-clinical-blue/5' : 'border-clinical-border'
                  }`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="counter_cash" 
                      checked={formData.payment_method === 'counter_cash'}
                      onChange={() => setFormData({ ...formData, payment_method: 'counter_cash' })}
                      className="mr-3"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-clinical-navy">Pay Cash at Front Reception Counter</p>
                      <p className="text-[11px] text-clinical-muted">Physical cash received into hospital treasury drawer.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest flex items-center">
                  <Calendar size={12} className="mr-1" /> Appointment Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  required
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">
                  Reason for Visit / Symptoms
                </label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Record patient complaints..."
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs h-28 focus:outline-none focus:border-clinical-blue"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-clinical-background/40 flex justify-end space-x-3">
            <Link 
              to="/appointments"
              className="px-5 py-2 border border-clinical-border bg-white text-clinical-muted hover:text-clinical-navy rounded text-xs font-bold transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-all disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={15} />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Save size={15} className="mr-2" />
                  Pay & Lock Appointment ($50.00)
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;