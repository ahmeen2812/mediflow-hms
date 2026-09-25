import React, { useState } from 'react';

interface AuthHeaderProps {
  mode: 'signin' | 'register_request';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ mode }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {/* SOLID LOGO IMAGE CONTAINER */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-[#DCE4EC] p-2 flex items-center justify-center shadow-xs transition-transform duration-300 hover:scale-[1.02]">
        {!imageFailed ? (
          <img
            src="/logo.png"
            alt="Elixora Health Logo"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-contain select-none"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[#EBF3FA] flex flex-col items-center justify-center p-1 text-center">
            <span className="text-xs font-bold text-[#143A82] tracking-tighter leading-none uppercase">
              Elixora
            </span>
            <span className="text-[8px] font-semibold text-[#2E6F9E] tracking-widest mt-1">
              HEALTH
            </span>
          </div>
        )}
      </div>

      {/* BRAND & STATUS SUBTITLE */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
          {mode === 'signin' ? 'Hospital Command Center' : 'Access Authorization Request'}
        </h1>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Elixora Health Operating System • Institutional Portal
        </p>
      </div>
    </div>
  );
};