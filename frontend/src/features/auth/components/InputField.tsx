import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const isPasswordField = type === 'password';

  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
          {label}
        </label>
      </div>

      <div className="relative">
        <input
          id={id}
          type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => sound.playClick()}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full bg-white border border-[#DCE4EC] rounded-md px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-all duration-150 focus:border-[#143A82] focus:ring-1 focus:ring-[#143A82]"
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowPassword(!showPassword);
            }}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};