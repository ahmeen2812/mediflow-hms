import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/patients/?search=${encodeURIComponent(searchTerm)}`);
      setPatients(res.data);
    } catch (err: any) {
      console.error("Failed to load patients:", err);
      setError(err.response?.data?.detail || "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Patient Directory</h1>
          <p className="text-clinical-muted text-sm mt-1">Master patient index and demographic records.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchPatients}
            className="flex items-center px-3 py-2 border border-clinical-border bg-white text-clinical-muted rounded-md text-sm font-semibold hover:bg-clinical-background transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link 
            to="/register" 
            className="flex items-center px-4 py-2 bg-clinical-blue text-white rounded-md text-sm font-bold hover:bg-clinical-navy shadow-sm transition-all"
          >
            <UserPlus size={18} className="mr-2" /> Register New Patient
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-status-critical/10 border border-status-critical/30 rounded-lg flex items-center text-status-critical text-sm">
          <AlertCircle size={18} className="mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-clinical-border rounded-lg overflow-hidden shadow-sm">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-clinical-border bg-clinical-background/30 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name, MRN, or Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-clinical-border rounded text-sm outline-none focus:border-clinical-blue"
            />
          </div>
          <span className="text-xs font-semibold text-clinical-muted">
            Total Records: {patients.length}
          </span>
        </div>

        {/* Dense Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[11px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3.5">MRN</th>
              <th className="px-6 py-3.5">Full Name</th>
              <th className="px-6 py-3.5">Gender</th>
              <th className="px-6 py-3.5">Date of Birth</th>
              <th className="px-6 py-3.5">Phone Number</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-sm">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-clinical-background/40 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-clinical-blue">{p.mrn}</td>
                <td className="px-6 py-4 font-semibold text-clinical-text">{p.full_name}</td>
                <td className="px-6 py-4 text-clinical-muted">{p.gender}</td>
                <td className="px-6 py-4 text-clinical-muted">{p.date_of_birth}</td>
                <td className="px-6 py-4 text-clinical-muted">{p.phone}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/patients/${p.id}`} 
                    className="text-clinical-blue font-bold text-xs uppercase hover:underline"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {patients.length === 0 && !loading && (
          <div className="p-12 text-center text-clinical-muted text-sm italic">
            No patient records found. Click "Register New Patient" or visit /api/v1/setup-db.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center text-clinical-muted text-sm">
            Loading patient records...
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;