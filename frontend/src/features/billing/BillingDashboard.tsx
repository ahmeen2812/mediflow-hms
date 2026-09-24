import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Receipt, 
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Plus, 
  FileText, 
  RefreshCw, 
  X, 
  DollarSign, 
  Clock,
  ArrowRight
} from 'lucide-react';

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  patient_name: string;
  patient_mrn: string;
  patient_id: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface PendingCharge {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  charge_type: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference_id: string;
  created_at: string;
}

const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'wallet'>('invoices');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [pendingCharges, setPendingCharges] = useState<PendingCharge[]>([]);
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    unpaid_balance: 0,
    unpaid_invoices_count: 0,
    pending_charges_count: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Wallet Modal
  const [depositPatientId, setDepositPatientId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositMethod, setDepositMethod] = useState<string>("cash");
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchBillingData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/billing/overview');
      setMetrics(res.data.metrics);
      setInvoices(res.data.invoices || []);
      setPendingCharges(res.data.pending_charges || []);
    } catch (err) {
      console.error("Billing load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleGenerateInvoice = async (patientId: string) => {
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/billing/invoices/generate/${patientId}`, {
        discount: 0.0
      });
      alert(`Success! Generated ${res.data.invoice_number} for total of $${res.data.total_due.toFixed(2)}`);
      await fetchBillingData();
    } catch (err: any) {
      alert("Invoice Generation Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const openPaymentModal = async (inv: InvoiceSummary) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/billing/invoices/${inv.id}`);
      setSelectedInvoice(res.data);
      setPaymentAmount(res.data.balance_due);
    } catch (err) {
      alert("Error loading invoice details.");
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setSubmittingPayment(true);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/billing/invoices/${selectedInvoice.id}/payments`, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        cashier_notes: "Cashier payment settlement received."
      });
      alert(`Payment of $${paymentAmount} processed. Reference: ${res.data.payment_number}`);
      setSelectedInvoice(null);
      await fetchBillingData();
    } catch (err: any) {
      alert("Payment Failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleWalletDeposit = async () => {
    if (!depositPatientId || depositAmount <= 0) {
      alert("Please specify patient ID and valid deposit amount.");
      return;
    }
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/billing/wallet/${depositPatientId}/deposit`, {
        amount: Number(depositAmount),
        payment_method: depositMethod,
        approval_reference: "SUPERVISOR-APPROVED",
        notes: "Advance medical fund credit deposit."
      });
      alert(res.data.message);
      setShowDepositModal(false);
      await fetchBillingData();
    } catch (err: any) {
      alert("Deposit Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const openReceiptPrint = async (invoiceId: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/billing/invoices/${invoiceId}`);
      setReceiptData(res.data);
    } catch (err) {
      alert("Could not load receipt.");
    }
  };

  // Group pending charges by patient
  const patientChargeGroups = pendingCharges.reduce((acc: any, c) => {
    if (!acc[c.patient_id]) {
      acc[c.patient_id] = {
        patient_name: c.patient_name,
        patient_mrn: c.patient_mrn,
        patient_id: c.patient_id,
        charges: []
      };
    }
    acc[c.patient_id].charges.push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Hospital Cashier & Revenue Station</h1>
          <p className="text-xs text-clinical-muted mt-1 font-medium">
            Real-time outpatient charge capture, multi-mode invoicing, and patient medical wallet deposits.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowDepositModal(true)}
            className="flex items-center px-4 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
          >
            <Wallet size={15} className="mr-1.5" /> Deposit Patient Funds
          </button>
          <button 
            onClick={fetchBillingData}
            className="flex items-center px-3.5 py-2 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* FINANCIAL KPI TAPE */}
      <div className="grid grid-cols-4 bg-white border border-clinical-border rounded-lg divide-x divide-clinical-border shadow-sm">
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-success uppercase tracking-widest">Total Collected Revenue</p>
          <p className="text-2xl font-extrabold text-status-success mt-0.5">${metrics.total_revenue.toFixed(2)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-critical uppercase tracking-widest">Total Outstanding Dues</p>
          <p className="text-2xl font-extrabold text-status-critical mt-0.5">${metrics.unpaid_balance.toFixed(2)}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-warning uppercase tracking-widest">Unsettled Invoices</p>
          <p className="text-2xl font-extrabold text-status-warning mt-0.5">{metrics.unpaid_invoices_count}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">Pending Billable Items</p>
          <p className="text-2xl font-extrabold text-clinical-navy mt-0.5">{metrics.pending_charges_count}</p>
        </div>
      </div>

      {/* UNBILLED CHARGES NOTIFICATION (If doctor, lab, or meds ordered) */}
      {Object.keys(patientChargeGroups).length > 0 && (
        <div className="bg-clinical-blue/5 border border-clinical-blue/20 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-clinical-blue" />
              <h2 className="text-xs font-bold text-clinical-navy uppercase tracking-wider">
                Unbilled Outpatient Clinical Services Awaiting Invoicing ({Object.keys(patientChargeGroups).length} Patients)
              </h2>
            </div>
            <span className="text-[10px] text-clinical-muted font-medium">Automatic Charge Capture Active</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.values(patientChargeGroups).map((group: any) => {
              const totalUnbilled = group.charges.reduce((sum: number, c: any) => sum + c.total_amount, 0);

              return (
                <div key={group.patient_id} className="bg-white border border-clinical-border rounded p-4 flex justify-between items-center shadow-xs">
                  <div>
                    <p className="text-sm font-bold text-clinical-navy">{group.patient_name}</p>
                    <p className="text-xs font-mono text-clinical-muted">MRN: {group.patient_mrn}</p>
                    <p className="text-xs text-clinical-muted mt-1">
                      {group.charges.length} pending service items • Total: <b className="text-clinical-navy">${totalUnbilled.toFixed(2)}</b>
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateInvoice(group.patient_id)}
                    className="flex items-center px-4 py-2 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors shadow-sm"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Generate Invoice
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INVOICES TABLE */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-3.5 border-b border-clinical-border bg-clinical-background/50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-clinical-navy flex items-center">
            <Receipt size={16} className="mr-2 text-clinical-blue" />
            Official Patient Invoices & Settlement Registry
          </h2>
          <span className="text-[10px] text-clinical-muted font-mono">{invoices.length} Invoices</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[10px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3.5">Invoice #</th>
              <th className="px-6 py-3.5">Patient Details</th>
              <th className="px-6 py-3.5">Date & Time</th>
              <th className="px-6 py-3.5">Subtotal</th>
              <th className="px-6 py-3.5">Paid</th>
              <th className="px-6 py-3.5">Balance Due</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Cashier Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-xs">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-clinical-background/40 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-clinical-blue">{inv.invoice_number}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-clinical-navy text-sm">{inv.patient_name}</p>
                  <p className="text-[11px] font-mono text-clinical-muted">MRN: {inv.patient_mrn}</p>
                </td>
                <td className="px-6 py-4 font-mono text-clinical-muted text-[11px]">{inv.created_at}</td>
                <td className="px-6 py-4 font-mono font-semibold text-clinical-text">${inv.total_amount.toFixed(2)}</td>
                <td className="px-6 py-4 font-mono font-semibold text-status-success">${inv.amount_paid.toFixed(2)}</td>
                <td className="px-6 py-4 font-mono font-bold text-clinical-navy">
                  ${inv.balance_due.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                    inv.status === 'paid'
                      ? 'bg-status-success/10 text-status-success border-status-success/30'
                      : inv.status === 'partially_paid'
                      ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                      : 'bg-status-critical/10 text-status-critical border-status-critical/30'
                  }`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => openPaymentModal(inv)}
                        className="inline-flex items-center px-3 py-1.5 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
                      >
                        <CreditCard size={13} className="mr-1.5" /> Receive Payment
                      </button>
                    )}
                    <button
                      onClick={() => openReceiptPrint(inv.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
                      title="Print Official Receipt"
                    >
                      <Printer size={13} className="mr-1 text-clinical-muted" /> Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && !loading && (
          <div className="p-16 text-center text-clinical-muted text-xs italic">
            No invoices generated yet. When a doctor consults, labs are ordered, or meds are dispensed, charges will appear above.
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: RECEIVE PAYMENT (CASH, CARD, BANK, OR WALLET!)      */}
      {/* ============================================================ */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-clinical-navy/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-clinical-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-clinical-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-clinical-navy">
                  Settle Payment: {selectedInvoice.invoice_number}
                </h3>
                <p className="text-xs text-clinical-muted">
                  Patient: <b className="text-clinical-navy">{selectedInvoice.patient.full_name}</b> ({selectedInvoice.patient.mrn})
                </p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-clinical-muted hover:text-clinical-navy">
                <X size={18} />
              </button>
            </div>

            {/* WALLET BALANCE INFO BLOCK */}
            <div className="p-3.5 bg-clinical-blue/5 border border-clinical-blue/20 rounded flex justify-between items-center text-xs">
              <div>
                <p className="text-clinical-muted font-medium">Available Patient Medical Wallet Credit:</p>
                <p className="text-base font-bold text-clinical-blue font-mono mt-0.5">
                  ${Number(selectedInvoice.patient.wallet_balance || 0).toFixed(2)}
                </p>
              </div>
              {selectedInvoice.patient.wallet_balance >= selectedInvoice.balance_due && (
                <span className="text-[10px] font-bold px-2 py-1 bg-status-success/10 text-status-success border border-status-success/30 rounded">
                  ✓ Full Wallet Coverage
                </span>
              )}
            </div>

            {/* AMOUNT & METHOD */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between p-3 bg-clinical-background rounded border border-clinical-border">
                <span className="text-clinical-muted font-semibold">Total Balance Due:</span>
                <span className="font-bold text-clinical-navy text-sm font-mono">
                  ${selectedInvoice.balance_due.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.balance_due}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm font-mono font-bold text-clinical-navy outline-none focus:border-clinical-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Payment Tender Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs font-semibold text-clinical-navy outline-none"
                >
                  <option value="cash">💵 Cash Collection (Front Counter)</option>
                  <option value="card">💳 Credit / Debit Card POS</option>
                  <option value="bank_transfer">🏦 Direct Bank Wire / Cheque</option>
                  <option value="wallet">💼 Patient Medical Wallet Balance (Instant Cut)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-clinical-border">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-clinical-border rounded text-xs font-bold text-clinical-muted hover:text-clinical-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingPayment}
                onClick={handleProcessPayment}
                className="px-6 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingPayment ? "Recording..." : `Confirm Payment of $${paymentAmount.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADVANCE DEPOSIT TO PATIENT WALLET                   */}
      {/* ============================================================ */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-clinical-navy/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-clinical-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-clinical-border pb-3">
              <h3 className="text-sm font-bold text-clinical-navy flex items-center">
                <Wallet size={16} className="mr-2 text-clinical-teal" />
                Deposit Advance Medical Funds
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-clinical-muted hover:text-clinical-navy">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Select Patient</label>
                <select
                  value={depositPatientId}
                  onChange={e => setDepositPatientId(e.target.value)}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs font-semibold text-clinical-navy outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {invoices.map(i => (
                    <option key={i.patient_id} value={i.patient_id}>
                      {i.patient_name} ({i.patient_mrn})
                    </option>
                  ))}
                  {/* Fallback option for Ahmed Khan */}
                  <option value="b422786b-96b7-4be1-a0e6-1b84514f19d2">Ahmed Khan (PT-000001)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Deposit Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm font-mono font-bold text-clinical-navy outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Funding Mode / Authorization</label>
                <select
                  value={depositMethod}
                  onChange={e => setDepositMethod(e.target.value)}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs font-semibold text-clinical-navy outline-none"
                >
                  <option value="cash">Cash Tender</option>
                  <option value="card">Card POS Authorization</option>
                  <option value="bank_transfer">Direct Bank Wire</option>
                  <option value="corporate_approval">Hospital Board / Leader Approved Grant</option>
                </select>
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
                type="button"
                onClick={handleWalletDeposit}
                className="px-5 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90"
              >
                Authorize Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: OFFICIAL PRINTABLE RECEIPT / INVOICE               */}
      {/* ============================================================ */}
      {receiptData && (
        <div className="fixed inset-0 bg-clinical-navy/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-clinical-border rounded-lg max-w-2xl w-full p-8 shadow-2xl space-y-6">
            {/* PRINT BAR */}
            <div className="flex justify-between items-center border-b border-clinical-border pb-4 print:hidden">
              <span className="text-xs font-bold text-clinical-muted uppercase tracking-wider">Official Medical Receipt</span>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-4 py-1.5 bg-clinical-navy text-white rounded text-xs font-bold"
                >
                  <Printer size={14} className="mr-1.5" /> Print Receipt
                </button>
                <button onClick={() => setReceiptData(null)} className="p-1 hover:bg-clinical-background rounded text-clinical-muted">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* RECEIPT CONTENT (Matching Section 23 of Design Specification) */}
            <div className="space-y-6 font-sans">
              <div className="flex justify-between items-start border-b border-clinical-border pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-clinical-navy uppercase tracking-wider">MEDIFLOW HOSPITAL</h1>
                  <p className="text-[11px] text-clinical-muted">Medical City Campus, Outpatient Diagnostic Complex</p>
                  <p className="text-[11px] text-clinical-muted">Tel: +92 (42) 111-MEDIFLOW • Web: [mediflow.health](https://mediflow.health)</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm font-bold text-clinical-blue">{receiptData.invoice_number}</p>
                  <p className="text-[11px] text-clinical-muted">{receiptData.created_at}</p>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${receiptData.status === 'paid' ? 'text-status-success' : 'text-status-warning'}`}>
                    Status: {receiptData.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* PATIENT INFO */}
              <div className="p-3 bg-clinical-background rounded border border-clinical-border grid grid-cols-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-clinical-muted uppercase">Billed Patient</p>
                  <p className="font-bold text-clinical-navy text-sm">{receiptData.patient.full_name}</p>
                  <p className="font-mono text-[11px] text-clinical-muted">MRN: {receiptData.patient.mrn}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-clinical-muted uppercase">Phone / Contact</p>
                  <p className="font-medium text-clinical-text">{receiptData.patient.phone}</p>
                  <p className="text-[11px] text-clinical-muted">{receiptData.patient.address}</p>
                </div>
              </div>

              {/* ITEMIZED SERVICES TABLE */}
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b-2 border-clinical-navy text-[10px] font-bold uppercase text-clinical-navy">
                  <tr>
                    <th className="py-2">Description / Service</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinical-border">
                  {receiptData.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-clinical-navy">{it.description}</td>
                      <td className="py-2 text-clinical-muted text-[10px]">{it.category}</td>
                      <td className="py-2 text-center font-mono">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">${it.unit_price.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-bold">${it.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTALS SUMMARY */}
              <div className="border-t-2 border-clinical-navy pt-3 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-clinical-muted">
                    <span>SUBTOTAL:</span>
                    <span>${receiptData.subtotal.toFixed(2)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-status-success font-semibold">
                      <span>DISCOUNT:</span>
                      <span>-${receiptData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-clinical-navy border-t border-clinical-border pt-1">
                    <span>TOTAL DUE:</span>
                    <span>${receiptData.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-status-success font-bold">
                    <span>PAID TO DATE:</span>
                    <span>${receiptData.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-clinical-navy border-t-2 border-clinical-navy pt-1">
                    <span>BALANCE:</span>
                    <span>${receiptData.balance_due.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard; 