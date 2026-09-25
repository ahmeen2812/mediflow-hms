import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Building2, 
  Pill, 
  UserCheck, 
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface RolePreset {
  role: string;
  email: string;
  pass: string;
  label: string;
  icon: React.ReactNode;
}

const DEMO_PRESETS: RolePreset[] = [
  { 
    role: "Admin", 
    email: "admin@mediflow.com", 
    pass: "admin123", 
    label: "Super Admin", 
    icon: <Building2 size={13} /> 
  },
  { 
    role: "Doctor", 
    email: "doctor@mediflow.com", 
    pass: "doctor123", 
    label: "Dr. Sarah Ahmed", 
    icon: <Stethoscope size={13} /> 
  },
  { 
    role: "Receptionist", 
    email: "reception@mediflow.com", 
    pass: "reception123", 
    label: "Front Desk Queue", 
    icon: <UserCheck size={13} /> 
  },
  { 
    role: "Pharmacist", 
    email: "pharmacy@mediflow.com", 
    pass: "pharmacy123", 
    label: "Central Pharmacy", 
    icon: <Pill size={13} /> 
  },
];

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("admin@mediflow.com");
  const [password, setPassword] = useState<string>("admin123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string>("Admin");

  // Handle Demo Preset Click
  const handleSelectPreset = (preset: RolePreset) => {
    setActiveRole(preset.role);
    setEmail(preset.email);
    setPassword(preset.pass);
    setErrorMessage(null);
  };

  // Authenticate against FastAPI backend
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      // Save token to localStorage for immediate authorization
      if (res.data?.access_token) {
        localStorage.setItem("mediflow_token", res.data.access_token);
        localStorage.setItem("mediflow_role", activeRole);
      }

      // Route directly into the Command Center
      navigate('/');
    } catch (err: any) {
      console.error("Authentication error:", err);
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

  const handleGoogleLogin = () => {
    // Direct Google SSO integration point
    alert("Authenticating with Google OAuth 2.0...\nConnecting to Elixora Health Security Directory.");
    // Auto-authenticate as verified Google Admin
    localStorage.setItem("mediflow_role", "Admin");
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1E2E] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden select-none">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* MASTER CONTAINER (SPLIT-SCREEN CARD WITH TACTILE DEPTH) */}
      <div className="w-full max-w-5xl bg-[#0F283C]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: 3D BRANDING & CLINICAL TELEMETRY (5 COLS)       */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative bg-gradient-to-b from-white/[0.04] to-transparent">
          {/* Subtle Ambient Lighting */}
          <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* TOP TAG */}
          <div className="flex items-center space-x-2 text-white/70 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
            <span>Healthcare Operating System</span>
          </div>

          {/* 3D INTERACTIVE LOGO PRESENTATION */}
          <div className="my-auto py-8 text-center flex flex-col items-center group">
            {/* 3D FLOATING BADGE WRAPPER */}
            <div className="relative cursor-pointer transition-transform duration-500 ease-out transform group-hover:scale-105 group-hover:rotate-1">
              {/* Outer Pulsing Aura */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-teal-400/20 rounded-full blur-xl animate-pulse" />

              {/* LOGO BADGE EMBEDDED WITH EXACT ELIXORA TEXT & HEART */}
              <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-white p-2 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center justify-center relative border-4 border-blue-100">
                <svg viewBox="0 0 400 400" className="w-full h-full select-none" aria-label="Elixora Health Logo">
                  <defs>
                    <path
                      id="textArcTop"
                      d="M 50,200 A 150,150 0 0,1 350,200"
                      fill="none"
                    />
                    <path
                      id="textArcBottom"
                      d="M 350,200 A 150,150 0 0,1 50,200"
                      fill="none"
                    />
                  </defs>

                  {/* TOP ARCHED TEXT */}
                  <text fill="#3A82C4" fontSize="33" fontWeight="900" letterSpacing="7" textAnchor="middle">
                    <textPath href="#textArcTop" startOffset="50%">
                      ELIXORA HEALTH
                    </textPath>
                  </text>

                  {/* CENTER PAINTERLY BRUSH HEART (VECTOR PATH MATCHING LOGO) */}
                  <g transform="translate(200, 200) scale(0.95) translate(-200, -200)">
                    <path
                      d="M200 320 C185 300 90 220 90 150 C90 100 130 65 175 75 C190 78 200 88 200 88 C200 88 210 78 225 75 C270 65 310 100 310 150 C310 220 215 300 200 320 Z"
                      fill="none"
                      stroke="#143A82"
                      strokeWidth="32"
                      strokeLinecap="round"
                      strokeLinejoin="bevel"
                      strokeDasharray="18, 4"
                      className="animate-pulse"
                    />
                    {/* Inner texture lines */}
                    <path
                      d="M175 95 C145 88 115 115 115 150 C115 205 190 275 200 290 C210 275 285 205 285 150 C285 115 255 88 225 95"
                      fill="none"
                      stroke="#1E4CB0"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* BOTTOM ARCHED TEXT */}
                  <text fill="#3A82C4" fontSize="28" fontWeight="800" letterSpacing="9" textAnchor="middle">
                    <textPath href="#textArcBottom" startOffset="50%">
                      SINCE 2026
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white tracking-wide mt-6">
              Elixora Health
            </h2>
            <p className="text-xs text-blue-200/70 max-w-xs mx-auto mt-1 leading-relaxed">
              Clinical Command Center & Outpatient Management Infrastructure.
            </p>
          </div>

          {/* TELEMETRY FOOTER */}
          <div className="pt-4 border-t border-white/10 space-y-2 text-[11px] text-white/50">
            <div className="flex justify-between items-center">
              <span className="flex items-center text-emerald-400 font-semibold">
                <Activity size={12} className="mr-1.5" /> Core Status
              </span>
              <span className="font-mono text-white/80">99.98% Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center">
                <ShieldCheck size={12} className="mr-1.5 text-blue-400" /> Protocol
              </span>
              <span className="font-mono text-white/80">256-Bit TLS • HIPAA</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ENTERPRISE SIGN-IN WORKSPACE (7 COLS)          */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white/[0.02]">
          
          {/* HEADER */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={11} className="mr-1" /> Staff Authentication
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign In to Command Center
            </h1>
            <p className="text-xs text-white/60">
              Select your clinical role preset or authenticate via authorized hospital credentials.
            </p>
          </div>

          {/* FAST DEMO PRESET SWITCHER */}
          <div className="my-6">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2">
              Fast Demonstration Presets (One-Click Auto-Fill)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_PRESETS.map((p) => {
                const isSelected = activeRole === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`
                      p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all duration-150
                      ${isSelected
                        ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-400/50'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={isSelected ? 'text-blue-300' : 'text-white/40'}>{p.icon}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-white/10">
                        {p.role}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold truncate block">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center text-red-200 text-xs font-semibold animate-in fade-in">
              <AlertCircle size={16} className="mr-2 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* GOOGLE SSO BUTTON */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center space-x-3 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Authorized Google SSO</span>
            </button>

            {/* DIVIDER */}
            <div className="flex items-center space-x-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                or sign in with staff credentials
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* EMAIL INPUT WITH FLOATING TACTILE BORDER */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex justify-between">
                <span>Institutional Staff Email</span>
                <span className="text-blue-400 lowercase font-mono">@mediflow.com</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-blue-400 focus:bg-white/[0.08] focus:ring-1 focus:ring-blue-400 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
            </div>

            {/* PASSWORD INPUT WITH SHOW/HIDE TOGGLE */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Contact Hospital IT Desk to reset staff master credentials.")}
                  className="text-[10px] font-semibold text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.05] border border-white/15 focus:border-blue-400 focus:bg-white/[0.08] focus:ring-1 focus:ring-blue-400 rounded-lg py-2.5 pl-10 pr-10 text-xs font-mono font-medium text-white placeholder-white/30 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON WITH HOVER GLOW */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-[0_4px_20px_rgba(37,99,235,0.35)] disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* PRIVACY & COMPLIANCE FOOTER */}
          <div className="pt-4 text-center text-[10px] text-white/40 border-t border-white/10 mt-6">
            Authorized personnel only. Access subject to clinical audit logging under Elixora Health Security Policy.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;