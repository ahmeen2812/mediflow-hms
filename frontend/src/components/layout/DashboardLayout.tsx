import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ListOrdered, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Receipt, 
  Settings, 
  Menu, 
  Search, 
  Bell, 
  HelpCircle,
  UserPlus
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, collapsed }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link 
      to={to} 
      className={`
        flex items-center px-5 py-2.5 cursor-pointer transition-colors duration-150
        ${active 
          ? 'bg-white/10 text-white font-semibold border-r-4 border-clinical-blue' 
          : 'text-white/70 hover:bg-white/5 hover:text-white font-medium'
        }
      `}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="ml-3.5 text-sm tracking-tight">{label}</span>}
    </Link>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role = "Admin" }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-clinical-background font-sans text-clinical-text overflow-hidden">
      {/* 248px FIXED LEFT SIDEBAR */}
      <aside 
        className={`
          ${collapsed ? 'w-[72px]' : 'w-[248px]'} 
          transition-all duration-200 bg-clinical-navy flex flex-col flex-shrink-0 select-none z-20 shadow-sm
        `}
      >
       {/* ELIXORA HEALTH BRAND HEADER (WITH REAL LOGO IMAGE) */}
        <div className="h-16 flex items-center px-4 border-b border-[#DCE4EC] bg-white flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-2xs border border-[#DCE4EC] p-0.5">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <span className="font-bold text-[#143A82] tracking-wider text-sm uppercase leading-none block">
                Elixora Health
              </span>
              <span className="text-[9px] text-[#2E6F9E] tracking-widest uppercase font-semibold block mt-0.5">
                Hospital OS • Since 2026
              </span>
            </div>
          )}
        </div>
        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5">
          <NavItem icon={<LayoutDashboard size={19} />} label="Command Center" to="/" collapsed={collapsed} />

          {/* SECTION: PATIENT CARE */}
          <div className="px-5 pt-4 pb-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {!collapsed && "Patient Care"}
          </div>
          <NavItem icon={<Users size={19} />} label="Patients Directory" to="/patients" collapsed={collapsed} />
          <NavItem icon={<UserPlus size={19} />} label="Register Patient" to="/register" collapsed={collapsed} />
          <NavItem icon={<Calendar size={19} />} label="Appointments" to="/appointments" collapsed={collapsed} />
          <NavItem icon={<ListOrdered size={19} />} label="Live Queue" to="/queue" collapsed={collapsed} />

          {/* SECTION: CLINICAL & STAFF */}
          <div className="px-5 pt-4 pb-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {!collapsed && "Clinical Operations"}
          </div>
          <NavItem icon={<Stethoscope size={19} />} label="Doctors & Staff" to="/staff/doctors" collapsed={collapsed} />
          <NavItem icon={<FlaskConical size={19} />} label="Laboratory Orders" to="/laboratory" collapsed={collapsed} />
          <NavItem icon={<Pill size={19} />} label="Pharmacy & Meds" to="/pharmacy" collapsed={collapsed} />

          {/* SECTION: FINANCE */}
          <div className="px-5 pt-4 pb-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {!collapsed && "Finance & Billing"}
          </div>
          <NavItem icon={<Receipt size={19} />} label="Billing & Invoices" to="/billing" collapsed={collapsed} />
        </nav>

        {/* SETTINGS FOOTER */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <NavItem icon={<Settings size={19} />} label="System Settings" to="/settings" collapsed={collapsed} />
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP UTILITY BAR */}
        <header className="h-16 bg-white border-b border-clinical-border flex items-center justify-between px-8 flex-shrink-0 z-10">
          {/* SEARCH FIELD */}
          <div className="flex items-center flex-1 max-w-xl">
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="mr-5 p-1.5 rounded text-clinical-muted hover:text-clinical-navy hover:bg-clinical-background transition-colors"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-clinical-muted" size={17} />
              <input 
                type="text" 
                placeholder="Search patient name, MRN, physician, prescription... (Ctrl + K)" 
                className="w-full bg-clinical-background border border-clinical-border rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-clinical-blue focus:bg-white transition-all placeholder:text-clinical-muted/70"
              />
            </div>
          </div>

          {/* UTILITY ICONS & USER BADGE */}
          <div className="flex items-center space-x-5 ml-4">
            <button className="relative p-1.5 text-clinical-muted hover:text-clinical-navy rounded hover:bg-clinical-background transition-colors">
              <Bell size={19} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full"></span>
            </button>
            <button className="p-1.5 text-clinical-muted hover:text-clinical-navy rounded hover:bg-clinical-background transition-colors">
              <HelpCircle size={19} />
            </button>
            
            <div className="flex items-center space-x-3 border-l pl-5 border-clinical-border">
              <div className="text-right">
                <p className="text-xs font-bold leading-none text-clinical-navy">Administrator</p>
                <p className="text-[10px] text-clinical-muted uppercase font-semibold mt-1">Super User</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-clinical-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
                SU
              </div>
            </div>
          </div>
        </header>

        {/* PRIMARY WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 bg-clinical-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;