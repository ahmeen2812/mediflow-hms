import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { sound } from '../utils/sound';

interface InputFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div className="space-y-1 text-left w-full">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] block">
        {label}
      </label>

      {/* TACTILE INPUT WRAPPER WITH ANIMATED FOCUS BORDER */}
      <div className="relative rounded-md overflow-hidden">
        {/* Animated Moving Focus Border using Framer Motion */}
        <motion.div
          initial={false}
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 0.96
          }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 border-2 border-[#143A82] rounded-md pointer-events-none z-10"
        />

        <input
          id={id}
          type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            sound.playFocus();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-[#FAFCFE] hover:bg-white border border-[#DCE4EC] rounded-md px-3.5 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors duration-150"
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowPassword(!showPassword);
            }}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#143A82] transition-colors p-1 z-20 cursor-pointer"
            title={showPassword ? "Hide" : "Show"}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};