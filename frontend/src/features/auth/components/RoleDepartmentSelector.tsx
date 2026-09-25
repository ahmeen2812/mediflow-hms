import React from 'react';
import { type StaffRole, ROLE_DEPARTMENTS } from '../types';
import { sound } from '../utils/sound';

interface Props {
  selectedRole: StaffRole;
  onRoleChange: (role: StaffRole) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
}

export const RoleDepartmentSelector: React.FC<Props> = ({
  selectedRole,
  onRoleChange,
  selectedDepartment,
  onDepartmentChange
}) => {
  const isCashier = selectedRole === 'Cashier';
  const availableDepartments = ROLE_DEPARTMENTS[selectedRole];

  const handleRoleSelect = (role: StaffRole) => {
    sound.playClick();
    onRoleChange(role);
    // Auto-select the first valid department for this role
    const depts = ROLE_DEPARTMENTS[role];
    if (depts && depts.length > 0) {
      onDepartmentChange(depts[0]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 text-left w-full">
      {/* ROLE SELECTION */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] block">
          Staff Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleSelect(e.target.value as StaffRole)}
          className="w-full bg-[#FAFCFE] border border-[#DCE4EC] rounded-md px-3 py-2 text-xs text-[#0F172A] font-semibold outline-none focus:border-[#143A82] transition-colors cursor-pointer"
        >
          <option value="Doctor">Doctor / Physician</option>
          <option value="Nurse">Staff Nurse</option>
          <option value="Lab Technician">Lab Technologist</option>
          <option value="Pharmacist">Pharmacist</option>
          <option value="Cashier">Cashier</option>
          <option value="Administrator">Administrator</option>
        </select>
      </div>

      {/* DYNAMIC DEPARTMENT SELECTION */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] block">
          Assigned Department
        </label>
        {isCashier ? (
          <div className="w-full bg-[#EBF3FA] border border-[#DCE4EC] rounded-md px-3 py-2 text-[11px] font-bold text-[#143A82] flex items-center h-[34px]">
            Central Revenue Desk
          </div>
        ) : (
          <select
            value={selectedDepartment}
            onChange={(e) => {
              sound.playClick();
              onDepartmentChange(e.target.value);
            }}
            className="w-full bg-[#FAFCFE] border border-[#DCE4EC] rounded-md px-3 py-2 text-xs text-[#0F172A] font-medium outline-none focus:border-[#143A82] transition-colors cursor-pointer"
          >
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};