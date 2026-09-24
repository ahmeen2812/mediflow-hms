import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const PatientRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    initial_deposit: 100 // Default suggested advance deposit ($100 / Rs. 5,000)
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/patients/', formData);
      alert(`Success! Patient Registered.\nMRN: ${response.data.mrn}\nInitial Wallet Balance: $${response.data.wallet_balance.toFixed(2)}`);
      navigate(`/patients/${response.data.id}`);
    } catch (error: any) {
      alert("Error saving patient: " + (error.response?.data?.detail || "Check backend."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-clinical-navy">New Patient Intake & Account Setup</h1>
          <p className="text-xs text-clinical-muted mt-1">Register legal demographics and configure advance medical wallet.</p>
        </div>
      </div>

      <div className="bg-white border border-clinical-border rounded-lg divide-y divide-clinical-border shadow-sm">
        {/* PREPAID WALLET INTAKE TAPE */}
        <div className="p-6 bg-clinical-teal/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-clinical-teal text-white rounded">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-clinical-navy uppercase tracking-wider">Initial Advance Medical Deposit</p>
              <p className="text-[11px] text-clinical-muted">Cash received at registration to fund doctor visits and medications.</p>
            </div>
          </div>

          <div className="w-48">
            <input 
              type="number" 
              name="initial_deposit" 
              min="0"
              value={formData.initial_deposit} 
              onChange={handleChange}
              className="w-full bg-white border border-clinical-border rounded px-3 py-1.5 text-sm font-mono font-bold text-clinical-navy focus:border-clinical-blue outline-none" 
            />
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Input label="Full Legal Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
            <Input label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} required />
            <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
            <Input label="Emergency Contact Person" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
            <div className="col-span-2">
               <label className="text-[10px] font-bold text-clinical-muted uppercase">Residential Address</label>
               <textarea name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue h-20" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-clinical-background/30 flex justify-end space-x-4">
          <button type="submit" disabled={loading} className="px-8 py-2 bg-clinical-blue rounded text-xs font-bold text-white hover:bg-clinical-navy disabled:opacity-50 transition-colors shadow-sm">
            {loading ? "Registering & Depositing..." : "Complete Registration & Open Account"}
          </button>
        </div>
      </div>
    </form>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-clinical-muted uppercase">{label}</label>
    <input {...props} className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue" />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-clinical-muted uppercase">{label}</label>
    <select {...props} className="w-full bg-clinical-background border border-clinical-border rounded px-3 py-2 text-xs focus:outline-none focus:border-clinical-blue">
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default PatientRegistration;