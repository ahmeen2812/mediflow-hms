import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

import { type AuthMode } from './types';
import { sound } from './utils/sound';
import { AuthHeader } from './components/AuthHeader';
import { InputField } from './components/InputField';
import { GoogleButton } from './components/GoogleButton';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signin');
  
  // Sign In State
  const [email, setEmail] = useState<string>('admin@mediflow.com');
  const [password, setPassword] = useState<string>('admin123');

  // Register Request State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('Doctor');
  const [regDepartment, setRegDepartment] = useState<string>('Cardiology');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      if (res.data?.access_token) {
        localStorage.setItem("mediflow_token", res.data.access_token);
        localStorage.setItem("mediflow_role", "Admin");
      }

      sound.playSuccess();
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMessage(
        typeof detail === 'string' 
          ? detail 
          : "Invalid staff credentials. Verify email and master password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    alert(`Access request logged for ${regName} (${regEmail}) as ${regRole}.\nAn active Super Administrator will verify and activate this profile in the Administration Console.`);
    sound.playSuccess();
    setMode('signin');
  };

  const handleGoogleAuth = () => {
    alert("Authenticating with Google OAuth 2.0...\nConnecting to Elixora Health Security Directory.");
    localStorage.setItem("mediflow_role", "Admin");
    sound.playSuccess();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-[#0F172A]">
      {/* TOP COMPLIANCE BAR */}
      <div className="w-full max-w-md flex justify-between items-center text-[11px] font-semibold text-[#64748B]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#143A82]" />
          <span>Elixora Health Central Node</span>
        </div>
        <div className="flex items-center space-x-1">
          <ShieldCheck size={13} className="text-[#2E6F9E]" />
          <span>256-Bit Encrypted Session</span>
        </div>
      </div>

      {/* CENTER AUTHENTICATION CARD */}
      <div className="w-full max-w-md bg-white border border-[#DCE4EC] rounded-lg p-6 sm:p-8 shadow-xs my-auto space-y-6">
        {/* BRAND HEADER & LOGO IMAGE */}
        <AuthHeader mode={mode} />

        {/* CLEAN SEGMENTED TAB SWITCHER */}
        <div className="grid grid-cols-2 bg-[#F1F5F9] p-1 rounded-md border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-[#143A82] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Staff Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('register_request');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              mode === 'register_request'
                ? 'bg-white text-[#143A82] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Request Access
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] font-semibold flex items-center space-x-2">
            <AlertCircle size={15} className="flex-shrink-0 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: STAFF SIGN IN */}
        {mode === 'signin' ? (
          <div className="space-y-4">
            <GoogleButton onClick={handleGoogleAuth} disabled={loading} />

            <div className="flex items-center space-x-3 my-2">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                or use staff credentials
              </span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <InputField
                id="staff-email"
                label="Staff Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="name@hospital.org"
                autoComplete="username"
              />

              <InputField
                id="staff-password"
                label="Master Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••••••"
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-[#64748B]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-[#CBD5E1] text-[#143A82] focus:ring-0"
                  />
                  <span>Keep session active</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact your Super Administrator to issue a password reset token.")}
                  className="text-[#2E6F9E] hover:underline font-semibold"
                >
                  Forgot credentials?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#143A82] hover:bg-[#0F2F64] text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-2xs mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin mr-1.5" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Sign In to Workspace</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* MODE 2: REQUEST NEW STAFF ONBOARDING */
          <form onSubmit={handleRegisterRequest} className="space-y-4 text-left">
            <InputField
              id="req-name"
              label="Full Legal Name"
              type="text"
              value={regName}
              onChange={setRegName}
              placeholder="e.g. Dr. Hamza Malik"
            />

            <InputField
              id="req-email"
              label="Institutional Email"
              type="email"
              value={regEmail}
              onChange={setRegEmail}
              placeholder="hamza@mediflow.com"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                  Requested Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-white border border-[#DCE4EC] rounded-md px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#143A82]"
                >
                  <option value="Doctor">Doctor / Physician</option>
                  <option value="Receptionist">Receptionist / Queue</option>
                  <option value="Pharmacist">Central Pharmacist</option>
                  <option value="Lab Technician">Lab Technologist</option>
                  <option value="Cashier">Cashier / Billing</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                  Department
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full bg-white border border-[#DCE4EC] rounded-md px-3 py-2 text-xs text-[#0F172A] outline-none focus:border-[#143A82]"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] pt-1">
              New accounts require authorization by a Super Administrator before clinical permissions are provisioned.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2E6F9E] hover:bg-[#255C84] text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs mt-2"
            >
              Submit Access Request
            </button>
          </form>
        )}
      </div>

      {/* BOTTOM LEGAL FOOTER */}
      <footer className="w-full max-w-md text-center text-[10px] text-[#94A3B8] font-medium">
        Elixora Health Platform • Clinical Security & Audit Governance Active
      </footer>
    </div>
  );
};

export default LoginScreen;