import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Clock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface DaySchedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const DoctorSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const loadScheduleData = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const [docRes, schRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/v1/clinical/doctors/${id}`),
        axios.get(`http://127.0.0.1:8000/api/v1/clinical/doctors/${id}/schedule`)
      ]);
      
      setDoctor(docRes.data);
      const existing = schRes.data;
      
      const grid: DaySchedule[] = days.map(day => {
        const match = existing.find((s: any) => s.day_of_week.trim().toLowerCase() === day.toLowerCase());
        if (match) {
          return {
            day_of_week: day,
            start_time: match.start_time,
            end_time: match.end_time,
            slot_duration: match.slot_duration || 15,
            is_active: Boolean(match.is_active),
          };
        }
        return {
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 15,
          is_active: false,
        };
      });

      setSchedules(grid);
    } catch (err: any) {
      console.error("Error loading doctor schedule:", err);
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || "Could not retrieve doctor schedule."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, [id]);

  const toggleDayStatus = (index: number) => {
    const updated = [...schedules];
    updated[index].is_active = !updated[index].is_active;
    setSchedules(updated);
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const updated = [...schedules];
    updated[index][field] = value;
    setSchedules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setNotification(null);
    try {
      // Clean payload ensures no leftover DB IDs are passed
      const payload = schedules.map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration: Number(s.slot_duration),
        is_active: Boolean(s.is_active),
      }));

      await axios.post(`http://127.0.0.1:8000/api/v1/clinical/doctors/${id}/schedule`, payload);
      setNotification({
        type: 'success',
        message: "Master schedule saved successfully! Doctor status will calculate against real-time clock."
      });
      // Re-fetch to ensure sync
      await loadScheduleData();
    } catch (err: any) {
      console.error("Save schedule error:", err);
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || "Failed to update schedule in database."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-clinical-muted flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-clinical-blue" size={32} />
        <span className="text-sm font-semibold">Synchronizing with clinical schedule database...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/staff/doctors" className="p-2 hover:bg-clinical-border rounded-full transition-colors">
            <ArrowLeft size={20} className="text-clinical-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-clinical-navy">{doctor?.full_name} — Master Schedule</h1>
            <p className="text-sm text-clinical-muted font-medium uppercase tracking-tight">
              {doctor?.department_name} • {doctor?.specialization}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center px-6 py-2 bg-clinical-teal text-white rounded font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-lg border text-sm flex items-center ${
          notification.type === 'success' 
            ? 'bg-status-success/10 border-status-success/30 text-status-success' 
            : 'bg-status-critical/10 border-status-critical/30 text-status-critical'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle size={18} className="mr-3 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="mr-3 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Week Grid */}
      <div className="bg-white border border-clinical-border rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-clinical-border bg-clinical-background/50">
          {days.map(day => (
            <div key={day} className="px-4 py-3 text-[11px] font-bold text-clinical-navy uppercase border-r border-clinical-border last:border-r-0 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-clinical-border min-h-[380px]">
          {schedules.map((slot, idx) => (
            <div 
              key={slot.day_of_week} 
              className={`p-4 space-y-4 transition-colors ${
                slot.is_active ? 'bg-white' : 'bg-clinical-background/30'
              }`}
            >
              {/* Toggle Shift */}
              <div className="flex justify-center">
                <button 
                  type="button"
                  onClick={() => toggleDayStatus(idx)}
                  className={`w-full py-1.5 text-[10px] font-bold rounded border transition-all uppercase ${
                    slot.is_active 
                      ? 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/20' 
                      : 'bg-clinical-muted/10 text-clinical-muted border-clinical-border hover:bg-clinical-muted/20'
                  }`}
                >
                  {slot.is_active ? 'IN-CLINIC' : 'OFF'}
                </button>
              </div>

              {/* Time Configuration */}
              {slot.is_active ? (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-clinical-muted uppercase tracking-wider block">Start Shift</label>
                    <input 
                      type="time" 
                      value={slot.start_time} 
                      onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                      className="w-full text-xs font-semibold border-b border-clinical-border py-1 outline-none focus:border-clinical-blue bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-clinical-muted uppercase tracking-wider block">End Shift</label>
                    <input 
                      type="time" 
                      value={slot.end_time} 
                      onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                      className="w-full text-xs font-semibold border-b border-clinical-border py-1 outline-none focus:border-clinical-blue bg-transparent"
                    />
                  </div>
                  <div className="pt-3 border-t border-clinical-border flex items-center text-clinical-muted">
                    <Clock size={12} className="mr-1" />
                    <span className="text-[10px] font-medium">15 min slots</span>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-8 text-clinical-muted text-xs italic">
                  Not available
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;