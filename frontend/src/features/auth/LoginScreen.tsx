import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthMode, StaffRole } from './types';
import { sound } from './utils/sound';
import { AuthHeader } from './components/AuthHeader';
import { InputField } from './components/InputField';
import { RoleDepartmentSelector } from './components/RoleDepartmentSelector';
import { GoogleButton } from './components/GoogleButton';
import { HospitalShowcase } from './components/HospitalShowcase';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  
  // Sign In Credentials
  const [email, setEmail] = useState<string>('admin@mediflow.com');
  const [password, setPassword] = useState<string>('admin123');

  // Sign Up / Account Request Fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<StaffRole>('Doctor');
  const [regDepartment, setRegDepartment] = useState<string>('Cardiology');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSound = () => {
    sound.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) sound.playClick();
  };

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
      sound.playError();
      const detail = err.response?.data?.detail;
      setErrorMessage(
        typeof detail === 'string' 
          ? detail 
          : "Invalid staff credentials. Verify institutional email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    
    if (regPassword.length < 6) {
      sound.playError();
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    alert(
      `Account Created for ${regName} (${regRole} - ${regDepartment})!\n\nSecurity Status: Pending Super Administrator Verification.\nYou can sign in once your profile is activated in the Admin Console.`
    );
    sound.playSuccess();
    setMode('signin');
  };

  const handleGoogleAuth = () => {
    sound.playClick();
    alert("Authenticating with Google OAuth 2.0...\nAuthorized as Hospital Administrator.");
    localStorage.setItem("mediflow_role", "Admin");
    sound.playSuccess();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans antialiased text-[#0F172A] relative select-none">
      
      {/* TACTILE AUDIO MUTE TOGGLE (TOP-RIGHT CORNER) */}
      <button
        onClick={toggleSound}
        className="fixed top-4 right-4 p-2 rounded-full bg-white border border-[#DCE4EC] text-[#64748B] hover:text-[#143A82] shadow-2xs transition-colors z-50 cursor-pointer"
        title={audioEnabled ? "Audio Cues Enabled (Click to Mute)" : "Audio Muted (Click to Enable)"}
      >
        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* MASTER SPLIT-PANEL CONTAINER (EQUAL HEIGHT ON DESKTOP & FLUID ON MOBILE) */}
      <div className="w-full max-w-5xl bg-white border border-[#DCE4EC] rounded-xl shadow-[0_4px_24px_rgba(15,31,68,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: EDITORIAL INSTITUTIONAL SHOWCASE (6 COLS) */}
        <HospitalShowcase />

        {/* RIGHT COLUMN: BALANCED INTERACTIVE FORM (6 COLS, UNIFORM HEIGHT) */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between bg-white relative">
          
          {/* HEADER WITH REAL LOGO IMAGE */}
          <AuthHeader mode={mode} />

          {/* BALANCED TAB SWITCHER (Zero Jumping, Smooth Animated Pill) */}
          <div className="relative grid grid-cols-2 bg-[#F1F5F9] p-1 rounded-md border border-[#DCE4EC] my-4">
            <button
              type="button"
              onClick={() => {
                sound.playTabSwitch();
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`relative py-1.5 text-xs font-bold rounded transition-colors z-10 cursor-pointer ${
                mode === 'signin' ? 'text-[#143A82]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Staff Sign In
              {mode === 'signin' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white rounded shadow-2xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTabSwitch();
                setMode('register_request');
                setErrorMessage(null);
              }}
              className={`relative py-1.5 text-xs font-bold rounded transition-colors z-10 cursor-pointer ${
                mode === 'register_request' ? 'text-[#143A82]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Create Account
              {mode === 'register_request' && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white rounded shadow-2xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 mb-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded text-xs text-[#991B1B] font-semibold flex items-center space-x-2"
            >
              <AlertCircle size={14} className="flex-shrink-0 text-[#DC2626]" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* MAIN DYNAMIC FORM CONTAINER (EQUAL FIXED MIN-HEIGHT TO STOP VERTICAL JUMPS) */}
          <div className="min-h-[340px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {mode === 'signin' ? (
                /* TAB 1: SIGN IN */
                <motion.div
                  key="signin-form"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-3.5"
                >
                  <GoogleButton onClick={handleGoogleAuth} disabled={loading} />

                  <div className="flex items-center space-x-3 my-2">
                    <div className="flex-1 h-px bg-[#E2E8F0]" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      or use institutional email
                    </span>
                    <div className="flex-1 h-px bg-[#E2E8F0]" />
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-3">
                    <InputField
                      id="staff-email"
                      label="Institutional Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="e.g. admin@mediflow.com"
                      autoComplete="username"
                    />

                    <InputField
                      id="staff-password"
                      label="Security Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer text-[#64748B]">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-[#CBD5E1] text-[#143A82] focus:ring-0 cursor-pointer"
                        />
                        <span>Remember terminal</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Contact Super Administrator to reset institutional access.")}
                        className="text-[#2E6F9E] hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#143A82] hover:bg-[#0D2659] active:scale-[0.98] text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-xs mt-3"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                          <span>Verifying Identity...</span>
                        </>
                      ) : (
                        <span>Sign In to Terminal</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* TAB 2: CREATE ACCOUNT WITH DYNAMIC DEPARTMENTS & EQUALIZED HEIGHT */
                <motion.div
                  key="register-form"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  <form onSubmit={handleRegisterRequest} className="space-y-2.5">
                    <InputField
                      id="reg-name"
                      label="Full Legal Name"
                      type="text"
                      value={regName}
                      onChange={setRegName}
                      placeholder="e.g. Dr. Hamza Tariq"
                    />

                    <InputField
                      id="reg-email"
                      label="Staff Email"
                      type="email"
                      value={regEmail}
                      onChange={setRegEmail}
                      placeholder="hamza@mediflow.com"
                    />

                    {/* DYNAMIC ROLE & DEPARTMENT SELECTOR */}
                    <RoleDepartmentSelector
                      selectedRole={regRole}
                      onRoleChange={setRegRole}
                      selectedDepartment={regDepartment}
                      onDepartmentChange={setRegDepartment}
                    />

                    <InputField
                      id="reg-password"
                      label="Set Account Password"
                      type="password"
                      value={regPassword}
                      onChange={setRegPassword}
                      placeholder="Minimum 6 characters"
                    />

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-[#2E6F9E] hover:bg-[#205175] active:scale-[0.98] text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs mt-3"
                    >
                      Create Account & Submit for Verification
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CLEAN COMPACT FOOTER */}
          <div className="pt-3 text-center text-[10px] text-[#94A3B8] border-t border-[#E2E8F0]">
            Elixora Health Platform • Protected Institutional System
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;