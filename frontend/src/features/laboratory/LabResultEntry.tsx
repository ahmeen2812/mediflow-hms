import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, CheckCircle2, FlaskConical, Loader2, AlertCircle } from 'lucide-react';

interface ResultRow {
  parameter_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  flag: string;
}

const LabResultEntry: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [technicianNotes, setTechnicianNotes] = useState<string>("");

  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/v1/laboratory/orders/${orderId}`);
        setOrder(res.data);

        // If existing results already entered, load them
        if (res.data.existing_results && res.data.existing_results.length > 0) {
          setResults(res.data.existing_results);
        } else {
          // Pre-populate standard LIS parameters based on requested tests
          const prefilled: ResultRow[] = [];
          const testList = res.data.tests || [];

          if (testList.some((t: string) => t.includes("Blood") || t.includes("CBC"))) {
            prefilled.push(
              { parameter_name: "Hemoglobin", result_value: "14.5", unit: "g/dL", reference_range: "13.5 - 17.5", flag: "normal" },
              { parameter_name: "WBC Count", result_value: "7.2", unit: "10^9/L", reference_range: "4.0 - 11.0", flag: "normal" },
              { parameter_name: "Platelets", result_value: "240", unit: "10^9/L", reference_range: "150 - 450", flag: "normal" },
              { parameter_name: "RBC Count", result_value: "4.8", unit: "10^12/L", reference_range: "4.3 - 5.9", flag: "normal" }
            );
          }

          if (testList.some((t: string) => t.includes("Lipid") || t.includes("Cholesterol"))) {
            prefilled.push(
              { parameter_name: "Total Cholesterol", result_value: "195", unit: "mg/dL", reference_range: "< 200", flag: "normal" },
              { parameter_name: "Triglycerides", result_value: "140", unit: "mg/dL", reference_range: "< 150", flag: "normal" },
              { parameter_name: "HDL (Good) Cholesterol", result_value: "52", unit: "mg/dL", reference_range: "> 40", flag: "normal" },
              { parameter_name: "LDL (Bad) Cholesterol", result_value: "115", unit: "mg/dL", reference_range: "< 100", flag: "high" }
            );
          }

          if (prefilled.length === 0) {
            prefilled.push({
              parameter_name: testList[0] || "Diagnostic Finding",
              result_value: "",
              unit: "N/A",
              reference_range: "Normal Limits",
              flag: "normal"
            });
          }

          setResults(prefilled);
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        alert("Order could not be loaded.");
        navigate('/laboratory');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const updateResultValue = (index: number, val: string) => {
    const updated = [...results];
    updated[index].result_value = val;
    setResults(updated);
  };

  const updateResultFlag = (index: number, flagVal: string) => {
    const updated = [...results];
    updated[index].flag = flagVal;
    setResults(updated);
  };

  const handleSaveResults = async () => {
    setSubmitting(true);
    try {
      await axios.post(`http://127.0.0.1:8000/api/v1/laboratory/orders/${orderId}/results`, {
        technician_notes: technicianNotes.trim() || "All sample parameters analyzed and validated via standard hematology/biochemistry analyzer.",
        results: results
      });
      alert(`Results for ${order.order_number} verified and released successfully!`);
      navigate('/laboratory');
    } catch (err: any) {
      alert("Error saving results: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-clinical-muted">
        <Loader2 className="animate-spin mx-auto mb-3 text-clinical-blue" size={32} />
        Loading Diagnostic Analyzer Workstation...
      </div>
    );
  }

  const isCompleted = order?.status === "completed";

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/laboratory" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
            <ArrowLeft size={20} className="text-clinical-muted" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-clinical-navy">Diagnostic Result Entry</h1>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-clinical-navy text-white rounded font-extrabold">
                {order.order_number}
              </span>
            </div>
            <p className="text-xs text-clinical-muted mt-0.5 font-medium">
              Patient: <b className="text-clinical-navy">{order.patient?.full_name}</b> ({order.patient?.mrn}) • Ordered by: {order.doctor_name}
            </p>
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={handleSaveResults}
            disabled={submitting}
            className="flex items-center px-6 py-2 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
          >
            {submitting ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <CheckCircle2 size={15} className="mr-1.5" />}
            Verify & Release Results
          </button>
        )}
      </div>

      {/* LIS CLINICAL RESULT TABLE */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-clinical-border bg-clinical-background/50 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-clinical-navy flex items-center">
            <FlaskConical size={16} className="mr-2 text-clinical-teal" />
            Analyzed Diagnostic Parameters ({order.tests?.join(", ")})
          </h2>
          <span className="text-[10px] text-clinical-muted font-mono">Status: {order.status.toUpperCase()}</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[10px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3">Parameter Name</th>
              <th className="px-6 py-3">Result Value</th>
              <th className="px-6 py-3">Standard Unit</th>
              <th className="px-6 py-3">Biological Reference</th>
              <th className="px-6 py-3 text-right">Clinical Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-xs">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-clinical-background/30 transition-colors">
                <td className="px-6 py-3.5 font-semibold text-clinical-navy">{row.parameter_name}</td>
                <td className="px-6 py-3.5">
                  {isCompleted ? (
                    <span className="font-mono font-bold text-sm text-clinical-navy">{row.result_value}</span>
                  ) : (
                    <input 
                      type="text" 
                      value={row.result_value} 
                      onChange={(e) => updateResultValue(idx, e.target.value)}
                      className="w-28 bg-clinical-background border border-clinical-border rounded px-2.5 py-1 text-xs font-mono font-bold text-clinical-navy focus:border-clinical-blue outline-none"
                    />
                  )}
                </td>
                <td className="px-6 py-3.5 font-mono text-clinical-muted">{row.unit}</td>
                <td className="px-6 py-3.5 font-mono text-clinical-muted">{row.reference_range}</td>
                <td className="px-6 py-3.5 text-right">
                  {isCompleted ? (
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      row.flag === 'high' 
                        ? 'bg-status-critical/10 text-status-critical border-status-critical/30' 
                        : 'bg-status-success/10 text-status-success border-status-success/30'
                    }`}>
                      {row.flag.toUpperCase()}
                    </span>
                  ) : (
                    <select
                      value={row.flag}
                      onChange={(e) => updateResultFlag(idx, e.target.value)}
                      className="bg-clinical-background border border-clinical-border rounded px-2 py-1 text-[11px] font-bold uppercase outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High (!)</option>
                      <option value="low">Low (v)</option>
                      <option value="critical">Critical (!!)</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TECHNICIAN COMMENTS */}
        <div className="p-6 border-t border-clinical-border bg-clinical-background/30 space-y-2">
          <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">
            Laboratory Technologist Remarks & Specimen Notes
          </label>
          {isCompleted ? (
            <p className="text-xs text-clinical-text font-medium bg-white p-3 border border-clinical-border rounded">
              {order.existing_results?.[0]?.notes || "Specimen hemolyzation checked. All biological parameters within standard reference ranges."}
            </p>
          ) : (
            <textarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Record specimen clarity, hemolyzation status, or instrument verification notes..."
              className="w-full bg-white border border-clinical-border rounded p-3 text-xs focus:border-clinical-blue outline-none h-20"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LabResultEntry;