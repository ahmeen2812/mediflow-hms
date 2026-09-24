import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Wallet, 
  Plus, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  X, 
  RefreshCw, 
  DollarSign 
} from 'lucide-react';

const PatientProfile: React.FC = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositMethod, setDepositMethod] = useState<string>("cash");
  const [depositNotes, setDepositNotes] = useState<string>("Reception desk advance deposit");
  const [depositing, setDepositing] = useState<boolean>(false);

  const fetchFullRecord = async () => {
    if (!id) return;
    try {
      const [pRes, tRes, wRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/v1/patients/${id}`),
        axios.get(`http://127.0.0.1:8000/api/v1/encounters/patient/${id}/timeline`),
        axios.get(`http://127.0.0.1:8000/api/v1/billing/wallet/${id}`)
      ]);
      setPatient(pRes.data);
      setTimeline(Array.isArray(tRes.data) ? tRes.data : []);
      setWalletInfo(wRes.data);
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullRecord();
  }, [id]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) {
      alert("Deposit amount must be greater than zero.");
      return;
    }
    setDepositing(true);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/billing/wallet/${id}/deposit`, {
        amount: Number(depositAmount),
        payment_method: depositMethod,
        approval_reference: "RECEPTION-COUNTER",
        notes: depositNotes
      });
      alert(res.data.message);
      setShowDepositModal(false);
      await fetchFullRecord();
    } catch (err: any) {
      alert("Deposit Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setDepositing(false);
    }
  };

  if (loading || !patient) {
    return <div className="p-16 text-center text-clinical-muted text-xs font-semibold">Loading Patient Medical File...</div>;
  }

  const balance = walletInfo ? walletInfo.wallet_balance : (patient.wallet_balance || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/patients" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
            <ArrowLeft size={20} className="text-clinical-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-clinical-navy">{patient.full_name}</h1>
            <p className="text-xs text-clinical-muted font-medium mt-0.5">
              MRN: <span className="font-mono text-clinical-blue font-bold">{patient.mrn}</span> • {patient.gender} • DOB: {patient.date_of_birth}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center px-4 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={15} className="mr-1.5" /> Deposit Funds / Add Credit
          </button>
          <Link 
            to={`/book-appointment?patientId=${patient.id}&name=${encodeURIComponent(patient.full_name)}`}
            className="px-4 py-2 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors shadow-sm"
          >
            Book Appointment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: WALLET BALANCE & DEMOGRAPHICS (4 COLS) */}
        <div className="col-span-4 space-y-5">
          {/* PATIENT PREPAID MEDICAL ACCOUNT CARD */}
          <div className="bg-white border-2 border-clinical-teal/40 rounded-lg p-5 shadow-sm space-y-3 bg-gradient-to-br from-white to-clinical-teal/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-clinical-teal flex items-center">
                <Wallet size={14} className="mr-1.5" /> Patient Medical Account
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                balance > 0 
                  ? 'bg-status-success/10 text-status-success border-status-success/30' 
                  : 'bg-status-critical/10 text-status-critical border-status-critical/30'
              }`}>
                {balance > 0 ? "● Funded" : "● No Balance"}
              </span>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-clinical-navy font-mono">
                ${Number(balance).toFixed(2)}
              </p>
              <p className="text-[11px] text-clinical-muted mt-1">
                Available hospital credit for doctor fees, lab diagnostics, and pharmacy fulfillment.
              </p>
            </div>

            <button
              onClick={() => setShowDepositModal(true)}
              className="w-full py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center shadow-xs"
            >
              <Plus size={14} className="mr-1.5" /> Top Up Medical Wallet
            </button>
          </div>

          {/* DEMOGRAPHICS */}
          <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-clinical-border bg-clinical-background/40">
              <h2 className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">Identification</h2>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-clinical-muted uppercase">Phone Number</p>
                <p className="font-semibold text-clinical-text mt-0.5">{patient.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-clinical-muted uppercase">Email Address</p>
                <p className="font-semibold text-clinical-text mt-0.5">{patient.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-clinical-muted uppercase">Residential Address</p>
                <p className="font-semibold text-clinical-text mt-0.5">{patient.address || "Medical Colony, Outpatient District"}</p>
              </div>
              <div className="border-t border-clinical-border pt-3">
                <p className="text-[10px] font-bold text-clinical-muted uppercase">Emergency Contact</p>
                <p className="font-bold text-clinical-navy mt-0.5">{patient.emergency_contact_name || "Farhan Khan"}</p>
                <p className="text-clinical-muted text-[11px]">{patient.emergency_contact_phone || "+92 321 7654321"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TIMELINE & WALLET LEDGER (8 COLS) */}
        <div className="col-span-8 bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
          <div className="px-6 py-3.5 border-b border-clinical-border bg-clinical-background/40 flex justify-between items-center">
            <h2 className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">
              Longitudinal Clinical & Financial Timeline
            </h2>
            <span className="text-[10px] font-mono text-clinical-muted">
              Live Patient Ledger
            </span>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {timeline.map((item, idx) => (
                <div key={idx} className="border-l-2 border-clinical-border pl-6 relative space-y-1.5 pb-2">
                  <div className="w-3 h-3 bg-clinical-blue rounded-full absolute -left-[7px] top-1 border-2 border-white shadow-sm" />
                  
                  <div className="flex items-center justify-between text-[10px] font-bold text-clinical-muted uppercase">
                    <span>{item.date} • {item.time}</span>
                    <span className="font-mono text-clinical-blue font-extrabold">{item.badge}</span>
                  </div>

                  <h3 className="text-sm font-bold text-clinical-navy flex items-center">
                    {item.type === 'consultation' && <Stethoscope size={15} className="mr-2 text-clinical-blue" />}
                    {item.type === 'prescription' && <Pill size={15} className="mr-2 text-status-success" />}
                    {item.type === 'lab_order' && <FlaskConical size={15} className="mr-2 text-clinical-teal" />}
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-clinical-muted font-medium">{item.details}</p>

                  {item.vitals && (
                    <div className="flex space-x-3 text-[10px] font-mono bg-clinical-background p-2 rounded border border-clinical-border mt-2">
                      {item.vitals.bp && <span>BP: <b className="text-clinical-navy">{item.vitals.bp}</b></span>}
                      {item.vitals.hr && <span>Pulse: <b className="text-clinical-navy">{item.vitals.hr}</b></span>}
                      {item.vitals.temp && <span>Temp: <b className="text-clinical-navy">{item.vitals.temp}</b></span>}
                      {item.vitals.spo2 && <span>SpO2: <b className="text-clinical-navy">{item.vitals.spo2}</b></span>}
                    </div>
                  )}
                </div>
              ))}

              {timeline.length === 0 && (
                <div className="p-12 text-center text-clinical-muted text-xs italic">
                  No medical visits logged yet. Book an appointment or check in from the queue to start.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP-UP MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-clinical-navy/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleDepositSubmit} className="bg-white border border-clinical-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-clinical-border pb-3">
              <h3 className="text-sm font-bold text-clinical-navy flex items-center">
                <Wallet size={16} className="mr-2 text-clinical-teal" />
                Deposit Funds: {patient.full_name}
              </h3>
              <button type="button" onClick={() => setShowDepositModal(false)} className="text-clinical-muted hover:text-clinical-navy">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-clinical-background rounded border border-clinical-border flex justify-between items-center text-xs">
              <span className="text-clinical-muted">Current Balance:</span>
              <span className="font-bold text-clinical-navy font-mono">${Number(balance).toFixed(2)}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Deposit Amount ($ / Rs)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm font-mono font-bold text-clinical-navy outline-none focus:border-clinical-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Payment Mode / Authorization</label>
                <select
                  value={depositMethod}
                  onChange={e => setDepositMethod(e.target.value)}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs font-semibold text-clinical-navy outline-none"
                >
                  <option value="cash">💵 Cash Received at Counter</option>
                  <option value="card">💳 Credit / Debit Card POS</option>
                  <option value="bank_transfer">🏦 Direct Bank Wire</option>
                  <option value="corporate_approval">🏛 Hospital Director / Grant Approval</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Reference / Note</label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={e => setDepositNotes(e.target.value)}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-1.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-clinical-border">
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 border border-clinical-border rounded text-xs font-bold text-clinical-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={depositing}
                className="px-6 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 shadow-sm"
              >
                {depositing ? "Processing..." : `Authorize Deposit ($${depositAmount})`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;