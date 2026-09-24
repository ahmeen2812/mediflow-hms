import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Stethoscope, Edit, CalendarDays, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DoctorData {
  id: string;
  full_name: string;
  email: string;
  specialization: string;
  department_name: string;
  department_id: string;
  bio: string | null;
  is_available: boolean;
}

const DoctorListAdmin = () => {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/clinical/doctors');
      setDoctors(res.data);
    } catch (err: any) {
      console.error("Fetch doctors failed:", err);
      setError(err.response?.data?.detail || "Could not reach backend. Verify server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">Doctor Management</h1>
          <p className="text-clinical-muted text-sm mt-1">Manage clinical staff, specialties, and real-time clinical schedules.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchDoctors}
            className="flex items-center px-3 py-2 border border-clinical-border bg-white text-clinical-muted rounded-md text-sm font-semibold hover:bg-clinical-background transition-all"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <Link 
            to="/staff/doctors/new" 
            className="flex items-center px-4 py-2 bg-clinical-blue text-white rounded-md text-sm font-bold hover:bg-clinical-navy transition-all shadow-sm"
          >
            <UserPlus size={18} className="mr-2" /> Add New Doctor
          </Link>
        </div>
      </div>

      {/* Error Banner */}
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
              placeholder="Search by doctor, department, specialty..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-clinical-border rounded text-sm outline-none focus:border-clinical-blue"
            />
          </div>
          <span className="text-xs font-semibold text-clinical-muted">
            Total Staff: {doctors.length}
          </span>
        </div>

        {/* Dense Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-clinical-background text-[11px] font-bold uppercase text-clinical-muted tracking-widest border-b border-clinical-border">
            <tr>
              <th className="px-6 py-3.5">Doctor Name</th>
              <th className="px-6 py-3.5">Specialization</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Real-time Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border text-sm">
            {filteredDoctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-clinical-background/40 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-clinical-navy/10 flex items-center justify-center mr-3 flex-shrink-0">
                    <Stethoscope size={16} className="text-clinical-blue" />
                  </div>
                  <div>
                    <span className="font-bold text-clinical-navy block">{doc.full_name}</span>
                    <span className="text-xs text-clinical-muted">{doc.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-clinical-text font-medium">{doc.specialization}</td>
                <td className="px-6 py-4 text-clinical-muted font-medium">{doc.department_name}</td>
                <td className="px-6 py-4">
                  {doc.is_available ? (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 bg-status-success/10 text-status-success rounded border border-status-success/30">
                      ● Available Now
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 bg-clinical-muted/10 text-clinical-muted rounded border border-clinical-border">
                      ○ Offline
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link 
                      to={`/staff/doctors/schedule/${doc.id}`}
                      className="p-1.5 text-clinical-muted hover:text-clinical-blue hover:bg-clinical-blue/10 rounded transition-all"
                      title="Manage Weekly Schedule"
                    >
                      <CalendarDays size={18} />
                    </Link>
                    <Link 
                      to={`/staff/doctors/edit/${doc.id}`}
                      className="p-1.5 text-clinical-muted hover:text-clinical-navy hover:bg-clinical-background rounded transition-all"
                      title="Edit Profile"
                    >
                      <Edit size={18} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredDoctors.length === 0 && !loading && (
          <div className="p-12 text-center text-clinical-muted text-sm italic">
            No doctors found matching criteria. Click "Add New Doctor" or run setup-db.
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-clinical-muted text-sm">
            Loading medical staff directory...
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorListAdmin;