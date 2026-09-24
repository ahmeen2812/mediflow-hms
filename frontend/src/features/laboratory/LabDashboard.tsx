import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FlaskConical, TestTube, CheckCircle2, Clock, RefreshCw, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LabOrderItem {
  id: string;
  order_number: string;
  patient_name: string;
  patient_mrn: string;
  doctor_name: string;
  department: string;
  status: string;
  priority: string;
  created_at: string;
  tests: string[];
}

const LabDashboard: React.FC = () => {
  const [orders, setOrders] = useState<LabOrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/laboratory/orders');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch lab orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/v1/laboratory/orders/${orderId}/status`, {
        status: nextStatus
      });
      await fetchOrders();
    } catch (err) {
      alert("Failed to advance order status.");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-status-warning/30 bg-status-warning/10 text-status-warning">◷ Awaiting Sample</span>;
      case "sample_collected":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-blue/30 bg-clinical-blue/10 text-clinical-blue">● Sample Collected</span>;
      case "processing":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-teal/30 bg-clinical-teal/10 text-clinical-teal animate-pulse">⚙ In Analyzer</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-status-success/30 bg-status-success/10 text-status-success">✓ Verified & Released</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-border text-clinical-muted">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Diagnostic Laboratory Operations</h1>
          <p className="text-xs text-clinical-muted mt-1 font-medium">
            Phlebotomy intake, specimen processing, and structured clinical chemistry analyzer.
          </p>
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center px-3.5 py-2 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
        >
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI TAPE */}
      <div className="grid grid-cols-4 bg-white border border-clinical-border rounded-lg divide-x divide-clinical-border shadow-sm">
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Total Diagnostic Orders</p>
          <p className="text-2xl font-extrabold text-clinical-navy mt-0.5">{orders.length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-warning uppercase tracking-widest">Pending Specimen</p>
          <p className="text-2xl font-extrabold text-status-warning mt-0.5">{orders.filter(o => o.status === "pending").length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-blue uppercase tracking-widest">In Analyzer / Processing</p>
          <p className="text-2xl font-extrabold text-clinical-blue mt-0.5">{orders.filter(o => o.status === "processing" || o.status === "sample_collected").length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-success uppercase tracking-widest">Verified & Released</p>
          <p className="text-2xl font-extrabold text-status-success mt-0.5">{orders.filter(o => o.status === "completed").length}</p>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        {/* STATUS TABS */}
        <div className="px-6 py-3 border-b border-clinical-border bg-clinical-background/40 flex items-center space-x-2">
          {["all", "pending", "sample_collected", "processing", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === tab 
                  ? 'bg-clinical-navy text-white' 
                  : 'text-clinical-muted hover:text-clinical-navy hover:bg-white'
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[11px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3.5">Order ID</th>
              <th className="px-6 py-3.5">Patient Details</th>
              <th className="px-6 py-3.5">Attending Physician</th>
              <th className="px-6 py-3.5">Requested Diagnostics</th>
              <th className="px-6 py-3.5">Order Time</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Laboratory Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-xs">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="hover:bg-clinical-background/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-clinical-blue">
                  {o.order_number}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-clinical-navy text-sm">{o.patient_name}</p>
                  <p className="text-[11px] font-mono text-clinical-muted">{o.patient_mrn}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-clinical-text">{o.doctor_name}</p>
                  <p className="text-[11px] text-clinical-muted">{o.department}</p>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {o.tests.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-clinical-teal/10 text-clinical-teal border border-clinical-teal/20 rounded font-semibold text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-clinical-muted whitespace-nowrap">
                  {o.created_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(o.status)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end space-x-2">
                    {o.status === "pending" && (
                      <button 
                        onClick={() => handleStatusTransition(o.id, "sample_collected")}
                        className="inline-flex items-center px-3 py-1.5 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors shadow-sm"
                      >
                        <TestTube size={13} className="mr-1.5" /> Collect Sample
                      </button>
                    )}
                    {o.status === "sample_collected" && (
                      <button 
                        onClick={() => handleStatusTransition(o.id, "processing")}
                        className="inline-flex items-center px-3 py-1.5 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
                      >
                        <Clock size={13} className="mr-1.5" /> Put in Analyzer
                      </button>
                    )}
                    {(o.status === "processing" || o.status === "sample_collected") && (
                      <Link 
                        to={`/laboratory/entry/${o.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-status-success text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
                      >
                        <FileText size={13} className="mr-1.5" /> Enter Results
                      </Link>
                    )}
                    {o.status === "completed" && (
                      <Link 
                        to={`/laboratory/entry/${o.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
                      >
                        <CheckCircle2 size={13} className="mr-1.5 text-status-success" /> View Results
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-16 text-center text-clinical-muted text-xs italic">
            No diagnostic orders in this status category.
          </div>
        )}
      </div>
    </div>
  );
};

export default LabDashboard;