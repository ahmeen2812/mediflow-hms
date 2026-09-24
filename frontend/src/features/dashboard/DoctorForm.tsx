import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

const DoctorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    specialization: '',
    bio: '',
  });

  useEffect(() => {
    // 1. Fetch Departments
    axios.get('http://127.0.0.1:8000/api/v1/clinical/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Error loading departments:", err));

    // 2. If edit mode, load existing doctor data
    if (id) {
      setFetching(true);
      axios.get(`http://127.0.0.1:8000/api/v1/clinical/doctors/${id}`)
        .then(res => {
          setFormData({
            full_name: res.data.full_name || '',
            email: res.data.email || '',
            password: '*****',
            department_id: res.data.department_id || '',
            specialization: res.data.specialization || '',
            bio: res.data.bio || '',
          });
        })
        .catch(err => {
          console.error("Error fetching doctor:", err);
          setErrorMsg("Could not load doctor details.");
        })
        .finally(() => setFetching(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!formData.department_id) {
      setErrorMsg("Please select a department.");
      setLoading(false);
      return;
    }

    try {
      if (id) {
        // PATCH
        await axios.patch(`http://127.0.0.1:8000/api/v1/clinical/doctors/${id}`, {
          full_name: formData.full_name,
          department_id: formData.department_id,
          specialization: formData.specialization,
          bio: formData.bio,
        });
      } else {
        // POST
        await axios.post('http://127.0.0.1:8000/api/v1/clinical/doctors', {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          department_id: formData.department_id,
          specialization: formData.specialization,
          bio: formData.bio,
        });
      }
      navigate('/staff/doctors');
    } catch (err: any) {
      console.error("Submission failed:", err);
      const detail = err.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : "Failed to save doctor. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/staff/doctors" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
          <ArrowLeft size={20} className="text-clinical-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">{id ? 'Edit Doctor Profile' : 'Add New Doctor'}</h1>
          <p className="text-xs text-clinical-muted mt-0.5">Define medical credentials, specialization, and clinical department.</p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-status-critical/10 border border-status-critical/30 rounded-lg flex items-center text-status-critical text-sm">
          <AlertCircle size={18} className="mr-3 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {fetching ? (
        <div className="p-16 text-center text-clinical-muted">
          <Loader2 className="animate-spin mx-auto text-clinical-blue" size={28} />
          <p className="mt-2 text-sm font-semibold">Loading doctor profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-clinical-border rounded-lg divide-y divide-clinical-border shadow-sm">
          <div className="p-8 grid grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Full Name *</label>
              <input 
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Dr. John Doe"
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm outline-none focus:border-clinical-blue"
              />
            </div>

            {/* Email (only on creation) */}
            {!id && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Email Address *</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="doctor@mediflow.com"
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm outline-none focus:border-clinical-blue"
                />
              </div>
            )}

            {/* Password (only on creation) */}
            {!id && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Temporary Password *</label>
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm outline-none focus:border-clinical-blue"
                />
              </div>
            )}

            {/* Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Department *</label>
              <select 
                required
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm outline-none focus:border-clinical-blue"
              >
                <option value="">Select Department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialization */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Specialization *</label>
              <input 
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="e.g. Pediatric Cardiology"
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm outline-none focus:border-clinical-blue"
              />
            </div>

            {/* Bio */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-clinical-muted uppercase tracking-widest">Biography & Qualifications</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Medical degrees, hospital privileges, clinical focus..."
                className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-sm h-28 outline-none focus:border-clinical-blue"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="p-6 bg-clinical-background/30 flex justify-end space-x-3">
            <Link 
              to="/staff/doctors"
              className="px-5 py-2 border border-clinical-border bg-white rounded text-sm font-semibold text-clinical-muted hover:bg-clinical-background transition-all"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center px-6 py-2 bg-clinical-blue text-white rounded font-bold text-sm hover:bg-clinical-navy transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
              {id ? 'Update Doctor Profile' : 'Save Doctor Account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DoctorForm;