import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, PhoneCall, CheckCircle2, UserX, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QueueItem {
  id: string;
  token_number: string;
  patient_name: string;
  patient_mrn: string;
  doctor_name: string;
  department: string;
  status: string;
  checked_in_at: string;
  waiting_minutes: number;
  appointment_number: string;
  appointment_id?: string;
}

const LiveQueue: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/appointments/queue/live');
      if (Array.isArray(res.data)) {
        setQueue(res.data);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.error("Queue load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, 5000);
    return () => clearInterval(timer);
  }, []);

  const updateStatus = async (queueId: string, newStatus: string) => {
    setActionInProgress(queueId);
    try {
      await axios.patch(`http://127.0.0.1:8000/api/v1/appointments/queue/${queueId}/status`, {
        status: newStatus
      });
      await fetchQueue();
    } catch (err) {
      alert("Failed to update queue token status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-status-warning/30 bg-status-warning/10 text-status-warning">◷ Waiting</span>;
      case "called":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-blue/30 bg-clinical-blue/10 text-clinical-blue animate-pulse">● Called</span>;
      case "with_doctor":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-teal/30 bg-clinical-teal/10 text-clinical-teal">✓ In Consultation</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-status-success/30 bg-status-success/10 text-status-success">✓ Completed</span>;
      case "no_show":
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-status-critical/30 bg-status-critical/10 text-status-critical">! No Show</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-clinical-border text-clinical-muted">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Reception Live Queue</h1>
          <p className="text-clinical-muted text-xs mt-1 font-medium">
            Live patient intake status, assigned room calls, and queue timers. Auto-refreshes every 5s.
          </p>
        </div>
        <button 
          onClick={fetchQueue}
          className="flex items-center px-3.5 py-2 border border-clinical-border bg-white text-clinical-navy rounded text-xs font-bold hover:bg-clinical-background transition-colors"
        >
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Sync Now
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-4 bg-white border border-clinical-border rounded-lg divide-x divide-clinical-border shadow-sm">
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Active in Queue</p>
          <p className="text-2xl font-extrabold text-clinical-navy mt-0.5">{queue.length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-status-warning uppercase tracking-widest">Waiting Outside</p>
          <p className="text-2xl font-extrabold text-status-warning mt-0.5">{queue.filter(q => q.status === "waiting").length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-blue uppercase tracking-widest">Currently Called</p>
          <p className="text-2xl font-extrabold text-clinical-blue mt-0.5">{queue.filter(q => q.status === "called").length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-clinical-teal uppercase tracking-widest">With Physician</p>
          <p className="text-2xl font-extrabold text-clinical-teal mt-0.5">{queue.filter(q => q.status === "with_doctor").length}</p>
        </div>
      </div>

      {/* QUEUE TABLE */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-3 border-b border-clinical-border bg-clinical-background/40 flex items-center space-x-2">
          {["all", "waiting", "called", "with_doctor", "completed"].map((tab) => (
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
              <th className="px-6 py-3.5">Token</th>
              <th className="px-6 py-3.5">Patient Details</th>
              <th className="px-6 py-3.5">Attending Doctor</th>
              <th className="px-6 py-3.5">Check-In Time</th>
              <th className="px-6 py-3.5">Wait Time</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Station Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-xs">
            {filteredQueue.map((item) => (
              <tr key={item.id} className="hover:bg-clinical-background/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-base font-extrabold px-3 py-1 bg-clinical-navy text-white rounded shadow-sm">
                    {item.token_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-clinical-navy text-sm">{item.patient_name}</p>
                  <p className="text-[11px] font-mono text-clinical-muted">MRN: {item.patient_mrn}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-clinical-text">{item.doctor_name}</p>
                  <p className="text-[11px] text-clinical-muted">{item.department}</p>
                </td>
                <td className="px-6 py-4 font-mono text-clinical-muted whitespace-nowrap">{item.checked_in_at}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs font-semibold text-clinical-text">
                    <Clock size={13} className="mr-1 text-clinical-muted" />
                    <span>{item.waiting_minutes} mins</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end space-x-2">
                    {item.status === "waiting" && (
                      <button 
                        onClick={() => updateStatus(item.id, "called")}
                        disabled={actionInProgress === item.id}
                        className="inline-flex items-center px-3 py-1.5 bg-clinical-blue text-white rounded text-xs font-bold hover:bg-clinical-navy transition-colors disabled:opacity-50"
                      >
                        <PhoneCall size={13} className="mr-1.5" /> Call Patient
                      </button>
                    )}
                    {item.status === "called" && (
                      <Link 
                        to={`/consultation/${item.appointment_id || item.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-clinical-teal text-white rounded text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={13} className="mr-1.5" /> Start Visit
                      </Link>
                    )}
                    {item.status === "with_doctor" && (
                      <button 
                        onClick={() => updateStatus(item.id, "completed")}
                        disabled={actionInProgress === item.id}
                        className="inline-flex items-center px-3 py-1.5 bg-status-success text-white rounded text-xs font-bold hover:opacity-90 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} className="mr-1.5" /> Complete Visit
                      </button>
                    )}
                    {item.status !== "completed" && item.status !== "no_show" && (
                      <button 
                        onClick={() => updateStatus(item.id, "no_show")}
                        disabled={actionInProgress === item.id}
                        className="p-1.5 text-clinical-muted hover:text-status-critical rounded transition-colors"
                        title="Mark Patient No-Show"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredQueue.length === 0 && (
          <div className="p-16 text-center text-clinical-muted italic text-xs">
            No patients currently in this queue status filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveQueue;