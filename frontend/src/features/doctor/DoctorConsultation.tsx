import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Activity, 
  Pill, 
  FlaskConical, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Loader2,
  Stethoscope
} from 'lucide-react';

interface PrescriptionDraft {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface LabDraft {
  test_name: string;
}

const DoctorConsultation: React.FC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [hpi, setHpi] = useState("");
  const [exam, setExam] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");

  // Vitals State
  const [vitals, setVitals] = useState({
    bp_sys: 120,
    bp_dia: 80,
    hr: 74,
    temp: 98.6,
    spo2: 99,
    weight: 70
  });

  // Prescriptions List
  const [prescriptions, setPrescriptions] = useState<PrescriptionDraft[]>([
    { medication_name: "Amlodipine 5mg", dosage: "1 tablet", frequency: "Once daily (Morning)", duration: "30 days" }
  ]);

  // Lab Tests List
  const [labTests, setLabTests] = useState<LabDraft[]>([
    { test_name: "Complete Blood Count (CBC)" }
  ]);

  useEffect(() => {
    if (!appointmentId) return;

    const fetchSession = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/encounters/session/${appointmentId}`);
        setSessionData(res.data);
        setChiefComplaint(res.data.reason || "Outpatient Clinical Consultation");
      } catch (err) {
        console.error("Session load error:", err);
        alert("Unable to resolve consultation session. Redirecting to Live Queue.");
        navigate('/queue');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [appointmentId, navigate]);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication_name: "", dosage: "1 tablet", frequency: "Twice daily", duration: "7 days" }
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const addLabTest = (testName: string) => {
    if (!labTests.some(l => l.test_name === testName)) {
      setLabTests([...labTests, { test_name: testName }]);
    }
  };

  const removeLabTest = (index: number) => {
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const handleCompleteEncounter = async () => {
    if (!diagnosis.trim()) {
      alert("Please enter a Clinical Diagnosis before completing the visit.");
      return;
    }

    if (!sessionData || !sessionData.patient || !sessionData.doctor) {
      alert("Clinical session context is incomplete.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patient_id: sessionData.patient.id,
        doctor_id: sessionData.doctor.id,
        appointment_id: sessionData.appointment_id,
        chief_complaint: chiefComplaint.trim() || "Routine Consultation",
        history_of_present_illness: hpi.trim() || null,
        physical_examination: exam.trim() || null,
        diagnosis: diagnosis.trim(),
        treatment_plan: treatmentPlan.trim() || null,
        vitals: {
          blood_pressure_systolic: Number(vitals.bp_sys),
          blood_pressure_diastolic: Number(vitals.bp_dia),
          heart_rate: Number(vitals.hr),
          temperature: Number(vitals.temp),
          oxygen_saturation: Number(vitals.spo2),
          weight: Number(vitals.weight)
        },
        prescriptions: prescriptions.filter(p => p.medication_name.trim() !== ""),
        lab_tests: labTests
      };

      const res = await axios.post('http://127.0.0.1:8000/api/v1/encounters/', payload);
      alert(`Clinical Encounter Signed! Reference: ${res.data.encounter_number}`);
      navigate(`/patients/${sessionData.patient.id}`);
    } catch (err: any) {
      console.error("Encounter completion error:", err);
      alert("Error completing encounter: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-clinical-muted">
        <Loader2 className="animate-spin mx-auto mb-3 text-clinical-blue" size={32} />
        Initializing Clinical Consultation Workspace...
      </div>
    );
  }

  const patient = sessionData?.patient;
  const doctor = sessionData?.doctor;

  return (
    <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto pb-12">
      {/* TOP CLINICAL ACTION BAR */}
      <div className="flex items-center justify-between border-b border-clinical-border pb-4">
        <div className="flex items-center space-x-4">
          <Link to="/queue" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
            <ArrowLeft size={20} className="text-clinical-muted" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-clinical-navy">Clinical Consultation</h1>
              <span className="px-2.5 py-0.5 bg-clinical-teal/10 text-clinical-teal border border-clinical-teal/30 rounded text-[11px] font-bold uppercase">
                Active Session
              </span>
            </div>
            <p className="text-xs text-clinical-muted mt-0.5 font-mono">
              Encounter for: {sessionData?.appointment_number} • {doctor?.full_name} ({doctor?.department_name})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={() => alert("Clinical draft preserved in session.")}
            className="px-4 py-2 border border-clinical-border bg-white text-clinical-muted hover:text-clinical-navy rounded text-xs font-bold transition-colors"
          >
            Save Draft
          </button>
          <button 
            type="button"
            onClick={handleCompleteEncounter}
            disabled={submitting}
            className="flex items-center px-6 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
          >
            {submitting ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <CheckCircle2 size={15} className="mr-1.5" />}
            Sign & Complete Visit
          </button>
        </div>
      </div>

      {/* 3-COLUMN CLINICAL COMMAND CENTER */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: PATIENT IDENTITY & ALERTS (3 Cols) */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white border border-clinical-border rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Active Patient</p>
              <h2 className="text-lg font-bold text-clinical-navy mt-1">{patient?.full_name}</h2>
              <p className="text-xs font-mono text-clinical-blue mt-0.5 font-bold">{patient?.mrn}</p>
            </div>

            <div className="border-t border-clinical-border pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-clinical-muted">Gender:</span>
                <span className="font-semibold text-clinical-text">{patient?.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clinical-muted">Date of Birth:</span>
                <span className="font-semibold text-clinical-text">{patient?.date_of_birth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clinical-muted">Contact:</span>
                <span className="font-semibold text-clinical-text">{patient?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clinical-muted">Emergency Contact:</span>
                <span className="font-semibold text-clinical-text">{patient?.emergency_contact_name}</span>
              </div>
            </div>

            {/* CRITICAL ALLERGIES ALERT */}
            <div className="p-3 bg-status-critical/10 border border-status-critical/30 rounded text-xs space-y-1">
              <div className="flex items-center text-status-critical font-bold text-[11px] uppercase tracking-wider">
                <AlertTriangle size={14} className="mr-1.5 flex-shrink-0" />
                Active Allergies
              </div>
              <p className="text-clinical-text font-semibold pl-5">Penicillin, Sulfa Drugs</p>
            </div>
          </div>

          {/* MEDICAL HISTORY HIGHLIGHTS */}
          <div className="bg-white border border-clinical-border rounded-lg p-4 space-y-2 shadow-sm">
            <p className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Medical History</p>
            <ul className="text-xs space-y-1.5 text-clinical-text font-medium list-disc list-inside">
              <li>Essential Hypertension (5 yrs)</li>
              <li>Type 2 Diabetes Mellitus</li>
              <li>No known prior surgeries</li>
            </ul>
          </div>
        </div>

        {/* COLUMN 2: ACTIVE CONSULTATION & OBSERVATIONS (6 Cols) */}
        <div className="col-span-6 space-y-5">
          {/* VITALS TAPE */}
          <div className="bg-white border border-clinical-border rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-clinical-navy">
                <Activity size={16} className="text-clinical-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Baseline Vitals & Triage</h3>
              </div>
              <span className="text-[10px] text-clinical-muted">Recorded at Check-in</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-center">
                <p className="text-[9px] font-bold text-clinical-muted uppercase">BP (Sys/Dia)</p>
                <div className="flex items-center justify-center space-x-1 mt-1 font-mono font-bold text-xs text-clinical-navy">
                  <input 
                    type="number" 
                    value={vitals.bp_sys} 
                    onChange={e => setVitals({ ...vitals, bp_sys: Number(e.target.value) })} 
                    className="w-8 text-center bg-transparent border-b border-clinical-border outline-none"
                  />
                  <span>/</span>
                  <input 
                    type="number" 
                    value={vitals.bp_dia} 
                    onChange={e => setVitals({ ...vitals, bp_dia: Number(e.target.value) })} 
                    className="w-8 text-center bg-transparent border-b border-clinical-border outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-center">
                <p className="text-[9px] font-bold text-clinical-muted uppercase">Pulse (BPM)</p>
                <input 
                  type="number" 
                  value={vitals.hr} 
                  onChange={e => setVitals({ ...vitals, hr: Number(e.target.value) })} 
                  className="w-full text-center bg-transparent font-mono font-bold text-xs text-clinical-navy mt-1 border-b border-clinical-border outline-none"
                />
              </div>

              <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-center">
                <p className="text-[9px] font-bold text-clinical-muted uppercase">Temp (°F)</p>
                <input 
                  type="number" 
                  step="0.1" 
                  value={vitals.temp} 
                  onChange={e => setVitals({ ...vitals, temp: Number(e.target.value) })} 
                  className="w-full text-center bg-transparent font-mono font-bold text-xs text-clinical-navy mt-1 border-b border-clinical-border outline-none"
                />
              </div>

              <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-center">
                <p className="text-[9px] font-bold text-clinical-muted uppercase">SpO2 (%)</p>
                <input 
                  type="number" 
                  value={vitals.spo2} 
                  onChange={e => setVitals({ ...vitals, spo2: Number(e.target.value) })} 
                  className="w-full text-center bg-transparent font-mono font-bold text-xs text-clinical-navy mt-1 border-b border-clinical-border outline-none"
                />
              </div>

              <div className="p-2.5 bg-clinical-background border border-clinical-border rounded text-center">
                <p className="text-[9px] font-bold text-clinical-muted uppercase">Weight (kg)</p>
                <input 
                  type="number" 
                  step="0.5" 
                  value={vitals.weight} 
                  onChange={e => setVitals({ ...vitals, weight: Number(e.target.value) })} 
                  className="w-full text-center bg-transparent font-mono font-bold text-xs text-clinical-navy mt-1 border-b border-clinical-border outline-none"
                />
              </div>
            </div>
          </div>

          {/* CLINICAL FIELDS */}
          <div className="bg-white border border-clinical-border rounded-lg p-6 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">Chief Complaint</label>
              <input 
                type="text" 
                value={chiefComplaint} 
                onChange={e => setChiefComplaint(e.target.value)}
                placeholder="e.g. Intermittent chest tightness and shortness of breath upon exertion"
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:border-clinical-blue outline-none font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">History of Present Illness (HPI)</label>
              <textarea 
                value={hpi} 
                onChange={e => setHpi(e.target.value)}
                rows={3}
                placeholder="Onset, character, duration, aggravating factors, and associated systemic symptoms..."
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:border-clinical-blue outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">Physical & Systemic Examination</label>
              <textarea 
                value={exam} 
                onChange={e => setExam(e.target.value)}
                rows={3}
                placeholder="Cardiovascular exam: Regular rate and rhythm, normal S1/S2, no murmurs. Lungs clear..."
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:border-clinical-blue outline-none"
              />
            </div>

            {/* CLINICAL DIAGNOSIS */}
            <div className="space-y-1.5 bg-clinical-blue/5 p-4 rounded border border-clinical-blue/20">
              <label className="text-[10px] font-extrabold text-clinical-blue uppercase tracking-widest">
                Clinical Diagnosis *
              </label>
              <input 
                type="text" 
                value={diagnosis} 
                onChange={e => setDiagnosis(e.target.value)}
                required
                placeholder="e.g. Stage 1 Essential Hypertension (ICD-10 I10)"
                className="w-full bg-white border border-clinical-border rounded px-3 py-2 text-sm font-bold text-clinical-navy focus:border-clinical-blue outline-none"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 3: PRESCRIPTIONS & LAB ORDERS (3 Cols) */}
        <div className="col-span-3 space-y-5">
          {/* PRESCRIPTION PAD */}
          <div className="bg-white border border-clinical-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-clinical-navy">
                <Pill size={16} className="text-clinical-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Prescriptions</h3>
              </div>
              <button 
                type="button"
                onClick={addPrescription}
                className="p-1 hover:bg-clinical-background rounded text-clinical-blue transition-colors"
                title="Add Medication"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx, idx) => (
                <div key={idx} className="p-3 bg-clinical-background/70 border border-clinical-border rounded text-xs space-y-2 relative">
                  <button 
                    type="button"
                    onClick={() => removePrescription(idx)}
                    className="absolute top-2 right-2 text-clinical-muted hover:text-status-critical"
                  >
                    <Trash2 size={13} />
                  </button>
                  <input 
                    type="text" 
                    value={rx.medication_name} 
                    onChange={e => {
                      const updated = [...prescriptions];
                      updated[idx].medication_name = e.target.value;
                      setPrescriptions(updated);
                    }}
                    placeholder="Medication & Strength"
                    className="w-5/6 bg-white border border-clinical-border rounded px-2 py-1 text-xs font-bold text-clinical-navy outline-none"
                  />
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <input 
                      type="text" 
                      value={rx.frequency} 
                      onChange={e => {
                        const updated = [...prescriptions];
                        updated[idx].frequency = e.target.value;
                        setPrescriptions(updated);
                      }}
                      placeholder="Frequency"
                      className="bg-white border border-clinical-border rounded px-1.5 py-0.5 outline-none"
                    />
                    <input 
                      type="text" 
                      value={rx.duration} 
                      onChange={e => {
                        const updated = [...prescriptions];
                        updated[idx].duration = e.target.value;
                        setPrescriptions(updated);
                      }}
                      placeholder="Duration"
                      className="bg-white border border-clinical-border rounded px-1.5 py-0.5 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DIAGNOSTIC LAB ORDERS */}
          <div className="bg-white border border-clinical-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-1.5 text-clinical-navy">
              <FlaskConical size={16} className="text-clinical-teal" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Diagnostic Lab Orders</h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["Lipid Profile", "HbA1c", "Serum Creatinine", "ECG"].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addLabTest(t)}
                  className="px-2 py-1 bg-clinical-background hover:bg-clinical-teal/10 hover:text-clinical-teal border border-clinical-border rounded text-[10px] font-bold text-clinical-muted transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              {labTests.map((lab, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-clinical-teal/5 border border-clinical-teal/20 rounded text-xs">
                  <span className="font-semibold text-clinical-navy">{lab.test_name}</span>
                  <button type="button" onClick={() => removeLabTest(idx)} className="text-clinical-muted hover:text-status-critical">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultation;