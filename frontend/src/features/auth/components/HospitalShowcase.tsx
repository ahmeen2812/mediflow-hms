import React from 'react';
import { Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const HospitalShowcase: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-[#143A82] text-white select-none relative overflow-hidden">
      {/* REFINED ARCHITECTURAL MEDICAL GRID PATTERN */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* TOP INSTITUTIONAL IDENTITY */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-white/80">
            Node Online • Regional Care Network
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/60">v1.4.0-Enterprise</span>
      </div>

      {/* CENTER EDITORIAL MISSION STATEMENT */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="my-auto space-y-6 z-10"
      >
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-200">
            Clinical Command Architecture
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Precision Healthcare. <br />
            Unified Outpatient Operations.
          </h2>
          <p className="text-xs text-white/80 leading-relaxed max-w-sm pt-1 font-normal">
            Connecting reception queues, clinical diagnostics, automated drug formularies, and point-of-care patient medical wallets into a single ledger.
          </p>
        </div>

        {/* SOLID METRICS TAPE */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-white/10 border border-white/15 rounded-md">
            <p className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">Active System State</p>
            <p className="text-xl font-bold font-mono mt-0.5">99.98%</p>
            <p className="text-[10px] text-white/60">Core EHR uptime</p>
          </div>
          <div className="p-3.5 bg-white/10 border border-white/15 rounded-md">
            <p className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">Security Protocol</p>
            <p className="text-xl font-bold font-mono mt-0.5">TLS 1.3</p>
            <p className="text-[10px] text-white/60">Strict 256-bit isolation</p>
          </div>
        </div>
      </motion.div>

      {/* FOOTER VERIFICATION */}
      <div className="pt-6 border-t border-white/15 flex items-center justify-between text-[11px] text-white/70 z-10 font-medium">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 size={13} className="text-emerald-300" />
          <span>Elixora Health • Verified Care Facility</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <ShieldCheck size={13} className="text-sky-200" />
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </div>
  );
};