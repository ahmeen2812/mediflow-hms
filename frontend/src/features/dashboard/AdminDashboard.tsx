import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      {/* TOP STATS - FLAT BORDERED ROW */}
      <div className="grid grid-cols-4 bg-white border border-clinical-border rounded-lg overflow-hidden">
        <StatItem label="Total Patients" value="1,248" change="+8.2%" />
        <StatItem label="Appointments Today" value="384" change="+4.1%" />
        <StatItem label="Revenue (Daily)" value="$12,480" change="+6.8%" />
        <StatItem label="Active Staff" value="48 / 52" change="92%" />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* RECENT ACTIVITY TABLE - FLAT SECTION */}
        <div className="col-span-2 bg-white border border-clinical-border rounded-lg">
          <div className="px-6 py-4 border-b border-clinical-border flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-wider text-clinical-text">Recent Patient Visits</h2>
            <button className="text-clinical-blue text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-clinical-background text-[11px] font-bold uppercase text-clinical-muted">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinical-border text-sm">
              <Row name="Ahmed Khan" dept="Cardiology" doc="Dr. Sarah" status="Completed" />
              <Row name="Michael Lee" dept="General" doc="Dr. Ali" status="In Progress" />
              <Row name="Sarah Wong" dept="Pediatrics" doc="Dr. Maria" status="Waiting" />
              <Row name="John Doe" dept="Orthopedics" doc="Dr. Omar" status="Completed" />
            </tbody>
          </table>
        </div>

        {/* SYSTEM STATUS - FLAT SECTION */}
        <div className="bg-white border border-clinical-border rounded-lg">
          <div className="px-6 py-4 border-b border-clinical-border">
            <h2 className="font-bold text-sm uppercase tracking-wider text-clinical-text">System Alerts</h2>
          </div>
          <div className="p-6 space-y-4">
            <Alert type="critical" msg="Low stock: Amlodipine 5mg" />
            <Alert type="warning" msg="3 Lab results awaiting verification" />
            <Alert type="info" msg="Weekly backup completed successfully" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, change }: any) => (
  <div className="p-6 border-r border-clinical-border last:border-r-0">
    <p className="text-[11px] font-bold text-clinical-muted uppercase tracking-widest">{label}</p>
    <div className="mt-2 flex items-baseline justify-between">
      <p className="text-2xl font-bold text-clinical-navy">{value}</p>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-clinical-teal/10 text-clinical-teal">
        {change}
      </span>
    </div>
  </div>
);

const Row = ({ name, dept, doc, status }: any) => (
  <tr className="hover:bg-clinical-background/50 cursor-pointer">
    <td className="px-6 py-4 font-medium">{name}</td>
    <td className="px-6 py-4 text-clinical-muted">{dept}</td>
    <td className="px-6 py-4 text-clinical-muted">{doc}</td>
    <td className="px-6 py-4">
      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-clinical-border">
        {status}
      </span>
    </td>
  </tr>
);

const Alert = ({ type, msg }: any) => {
  const colors: any = {
    critical: "border-l-status-critical text-status-critical",
    warning: "border-l-status-warning text-status-warning",
    info: "border-l-status-info text-status-info",
  };
  return (
    <div className={`pl-4 py-1 border-l-4 text-xs font-medium ${colors[type]}`}>
      {msg}
    </div>
  );
};

export default AdminDashboard;