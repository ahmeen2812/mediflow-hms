import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Plus, 
  PackagePlus, 
  Layers, 
  Clock, 
  Check, 
  X,
  FileCheck2
} from 'lucide-react';

interface RxItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
  stock_available: number;
  in_stock: boolean;
  unit_price: number;
}

interface PrescriptionQueueItem {
  id: string;
  prescription_number: string;
  patient_name: string;
  patient_mrn: string;
  doctor_name: string;
  department: string;
  status: string;
  created_at: string;
  is_all_in_stock: boolean;
  items: RxItem[];
}

interface MedicationItem {
  id: string;
  code: string;
  brand_name: string;
  generic_name: string;
  category: string;
  strength: string;
  dosage_form: string;
  unit_price: number;
  current_stock: number;
  low_stock_threshold: number;
  batch_number: string;
  expiry_date: string;
  status: 'healthy' | 'low_stock' | 'out_of_stock';
}

const PharmacyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory'>('queue');
  
  // Data State
  const [prescriptions, setPrescriptions] = useState<PrescriptionQueueItem[]>([]);
  const [inventory, setInventory] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispensingId, setDispensingId] = useState<string | null>(null);

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Restock Dialog State
  const [restockItem, setRestockItem] = useState<MedicationItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);

  const fetchPharmacyData = async () => {
    try {
      const [rxRes, invRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/v1/pharmacy/prescriptions'),
        axios.get('http://127.0.0.1:8000/api/v1/pharmacy/inventory')
      ]);
      setPrescriptions(Array.isArray(rxRes.data) ? rxRes.data : []);
      setInventory(Array.isArray(invRes.data) ? invRes.data : []);
    } catch (err) {
      console.error("Pharmacy sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
    const interval = setInterval(fetchPharmacyData, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleDispense = async (rxId: string) => {
    setDispensingId(rxId);
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/pharmacy/prescriptions/${rxId}/dispense`, {
        pharmacist_notes: "Checked against contraindications. Dispensed complete dosage regimen."
      });
      alert(`Success! ${res.data.message}`);
      await fetchPharmacyData();
    } catch (err: any) {
      alert("Dispensing Error: " + (err.response?.data?.detail || "Could not dispense prescription."));
    } finally {
      setDispensingId(null);
    }
  };

  const handleRestockSubmit = async () => {
    if (!restockItem) return;
    try {
      await axios.post(`http://127.0.0.1:8000/api/v1/pharmacy/inventory/${restockItem.id}/restock`, {
        quantity_added: Number(restockQty),
        notes: "Central hospital replenishment batch intake."
      });
      alert(`Restocked ${restockItem.brand_name} successfully.`);
      setRestockItem(null);
      await fetchPharmacyData();
    } catch (err: any) {
      alert("Restock error: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredInventory = inventory.filter(m => {
    const matchesSearch = 
      m.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const pendingRxCount = prescriptions.filter(p => p.status !== 'dispensed').length;
  const dispensedRxCount = prescriptions.filter(p => p.status === 'dispensed').length;
  const lowStockCount = inventory.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Central Outpatient Pharmacy</h1>
          <p className="text-xs text-clinical-muted mt-1 font-medium">
            Prescription fulfillment, inventory stock control, and automated pharmaceutical ledger.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchPharmacyData}
            className="flex items-center px-3.5 py-2 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI METRIC TAPE */}
      <div className="grid grid-cols-4 bg-white border border-clinical-border rounded-lg divide-x divide-clinical-border shadow-sm">
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-warning uppercase tracking-widest">Awaiting Dispensing</p>
          <p className="text-2xl font-extrabold text-status-warning mt-0.5">{pendingRxCount}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-success uppercase tracking-widest">Dispensed Today</p>
          <p className="text-2xl font-extrabold text-status-success mt-0.5">{dispensedRxCount}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-critical uppercase tracking-widest">Low Stock Warnings</p>
          <p className="text-2xl font-extrabold text-status-critical mt-0.5">{lowStockCount}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-navy uppercase tracking-widest">Active Formulary Items</p>
          <p className="text-2xl font-extrabold text-clinical-navy mt-0.5">{inventory.length}</p>
        </div>
      </div>

      {/* PRIMARY OPERATIONAL TABS */}
      <div className="flex border-b border-clinical-border space-x-6">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center transition-all ${
            activeTab === 'queue'
              ? 'border-b-2 border-clinical-blue text-clinical-blue font-extrabold'
              : 'text-clinical-muted hover:text-clinical-navy'
          }`}
        >
          <FileCheck2 size={16} className="mr-2" />
          Prescription Dispensing Queue ({pendingRxCount})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center transition-all ${
            activeTab === 'inventory'
              ? 'border-b-2 border-clinical-blue text-clinical-blue font-extrabold'
              : 'text-clinical-muted hover:text-clinical-navy'
          }`}
        >
          <Layers size={16} className="mr-2" />
          Formulary Inventory & Stock Ledger ({inventory.length} Drugs)
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PRESCRIPTION DISPENSING QUEUE                         */}
      {/* ============================================================ */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const isDispensed = rx.status === 'dispensed';

            return (
              <div 
                key={rx.id} 
                className={`bg-white border rounded-lg overflow-hidden shadow-sm transition-all ${
                  isDispensed ? 'border-clinical-border/60 opacity-80' : 'border-clinical-border'
                }`}
              >
                {/* RX HEADER */}
                <div className="px-6 py-3.5 bg-clinical-background/50 border-b border-clinical-border flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs px-2.5 py-1 bg-clinical-navy text-white rounded font-extrabold">
                      {rx.prescription_number}
                    </span>
                    <span className="text-sm font-bold text-clinical-navy">{rx.patient_name}</span>
                    <span className="text-xs font-mono text-clinical-muted">({rx.patient_mrn})</span>
                    <span className="text-xs text-clinical-muted">• Prescribed by {rx.doctor_name} ({rx.department})</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-mono text-clinical-muted">{rx.created_at}</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      isDispensed 
                        ? 'bg-status-success/10 text-status-success border-status-success/30' 
                        : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                    }`}>
                      {isDispensed ? '✓ Dispensed' : '◷ Pending Dispense'}
                    </span>
                  </div>
                </div>

                {/* RX ITEMS TABLE */}
                <div className="p-6 space-y-4">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
                      <tr>
                        <th className="pb-2">Medication Order</th>
                        <th className="pb-2">Dosing & Regimen</th>
                        <th className="pb-2">Duration</th>
                        <th className="pb-2">Qty Prescribed</th>
                        <th className="pb-2">Stock Availability</th>
                        <th className="pb-2 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clinical-border text-xs">
                      {rx.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3 font-bold text-clinical-navy text-sm flex items-center">
                            <Pill size={14} className="mr-2 text-clinical-blue" />
                            {it.medication_name}
                          </td>
                          <td className="py-3 text-clinical-text font-medium">{it.dosage} • {it.frequency}</td>
                          <td className="py-3 text-clinical-muted font-medium">{it.duration}</td>
                          <td className="py-3 font-mono font-bold text-clinical-navy">{it.quantity_prescribed} units</td>
                          <td className="py-3">
                            {it.in_stock ? (
                              <span className="inline-flex items-center text-[11px] font-bold text-status-success">
                                <Check size={13} className="mr-1" />
                                Available ({it.stock_available} in stock)
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] font-bold text-status-critical">
                                <AlertTriangle size={13} className="mr-1" />
                                Low / Insufficient ({it.stock_available} remaining)
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-clinical-text">
                            ${it.unit_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ACTION BAR */}
                  <div className="pt-3 border-t border-clinical-border flex justify-between items-center">
                    <div className="text-xs text-clinical-muted italic">
                      {isDispensed 
                        ? "Fulfillment logged in patient timeline and inventory ledger." 
                        : "Verify patient identity, contraindications, and stock availability before confirming dispense."}
                    </div>

                    {!isDispensed && (
                      <button
                        onClick={() => handleDispense(rx.id)}
                        disabled={dispensingId === rx.id}
                        className="inline-flex items-center px-6 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle2 size={15} className="mr-2" />
                        {dispensingId === rx.id ? "Updating Ledger..." : "Dispense Medication"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {prescriptions.length === 0 && !loading && (
            <div className="p-16 text-center text-clinical-muted bg-white border border-clinical-border rounded-lg text-xs italic">
              No prescriptions issued by doctors yet. Consultations with prescriptions will appear here automatically.
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: FORMULARY INVENTORY & STOCK LEDGER                    */}
      {/* ============================================================ */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm space-y-0">
          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="p-4 border-b border-clinical-border bg-clinical-background/40 flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical-muted" size={16} />
              <input
                type="text"
                placeholder="Search brand name, generic drug, or item code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-clinical-border rounded text-xs focus:outline-none focus:border-clinical-blue"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-white border border-clinical-border rounded px-3 py-1.5 text-xs font-semibold text-clinical-navy outline-none"
              >
                <option value="all">All Drug Classes</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Endocrine">Endocrine & Diabetes</option>
                <option value="Analgesics">Analgesics & Pain</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
                <option value="Respiratory">Respiratory</option>
              </select>
            </div>
          </div>

          {/* DRUG CATALOG TABLE */}
          <table className="w-full text-left border-collapse">
            <thead className="bg-clinical-background text-[10px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
              <tr>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Medication & Generic</th>
                <th className="px-6 py-3.5">Therapeutic Class</th>
                <th className="px-6 py-3.5">Strength / Form</th>
                <th className="px-6 py-3.5">Stock Status</th>
                <th className="px-6 py-3.5">Batch / Expiry</th>
                <th className="px-6 py-3.5">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinical-border text-xs">
              {filteredInventory.map((med) => (
                <tr key={med.id} className="hover:bg-clinical-background/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-clinical-blue">{med.code}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-clinical-navy text-sm">{med.brand_name}</p>
                    <p className="text-[11px] text-clinical-muted italic">{med.generic_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-clinical-navy/5 text-clinical-navy rounded border border-clinical-navy/10 font-medium text-[10px]">
                      {med.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-clinical-text">
                    {med.strength} • {med.dosage_form}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-clinical-navy">{med.current_stock}</span>
                        <span className="text-[10px] text-clinical-muted">units</span>
                      </div>
                      {med.status === 'low_stock' ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-status-critical/10 text-status-critical border border-status-critical/30 rounded">
                          ! Low (Reorder: {med.low_stock_threshold})
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-status-success/10 text-status-success border border-status-success/30 rounded">
                          ● Healthy
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-clinical-muted">
                    <p className="font-bold text-clinical-text">{med.batch_number}</p>
                    <p className="text-[10px]">Exp: {med.expiry_date}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-clinical-navy">
                    ${med.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setRestockItem(med)}
                      className="inline-flex items-center px-3 py-1.5 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
                    >
                      <PackagePlus size={13} className="mr-1.5 text-clinical-blue" />
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInventory.length === 0 && (
            <div className="p-16 text-center text-clinical-muted text-xs italic">
              No medications matching your search query.
            </div>
          )}
        </div>
      )}

      {/* RESTOCK MODAL DIALOG */}
      {restockItem && (
        <div className="fixed inset-0 bg-clinical-navy/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-clinical-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-5">
            <div className="flex justify-between items-center border-b border-clinical-border pb-3">
              <h3 className="text-sm font-bold text-clinical-navy">
                Replenish Stock: {restockItem.brand_name} ({restockItem.strength})
              </h3>
              <button onClick={() => setRestockItem(null)} className="text-clinical-muted hover:text-clinical-navy">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-clinical-background rounded border border-clinical-border">
                <span className="text-clinical-muted">Current Inventory:</span>
                <span className="font-bold text-clinical-navy font-mono">{restockItem.current_stock} units</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase">Quantity to Add (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs font-mono font-bold text-clinical-navy outline-none focus:border-clinical-blue"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setRestockItem(null)}
                className="px-4 py-2 border border-clinical-border rounded text-xs font-bold text-clinical-muted hover:text-clinical-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockSubmit}
                className="px-5 py-2 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;