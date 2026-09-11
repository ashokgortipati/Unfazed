import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import { Calendar, Clock, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";

const DAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 0, name: "Sunday" },
];

const Schedule = () => {
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [bufferTime, setBufferTime] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/scheduling/availability");
        if (res.data.success && res.data.availability) {
          setWeeklySchedule(res.data.availability.weekly_schedule || []);
          setBufferTime(res.data.availability.buffer_time_minutes || 15);
        }
      } catch (err) {
        console.error("Failed to load availability schedule", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleToggleDay = (dayOfWeek) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          return { ...day, isEnabled: !day.isEnabled };
        }
        return day;
      })
    );
  };

  const handleSlotChange = (dayOfWeek, index, field, value) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          const updatedSlots = [...day.slots];
          updatedSlots[index] = { ...updatedSlots[index], [field]: value };
          return { ...day, slots: updatedSlots };
        }
        return day;
      })
    );
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setSuccessMsg("");
      const res = await axiosInstance.put("/scheduling/availability", {
        weekly_schedule: weeklySchedule,
        buffer_time_minutes: bufferTime,
      });

      if (res.data.success) {
        setSuccessMsg("Weekly schedule and buffer times updated successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      alert("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading weekly availability settings..." />;

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Weekly Availability & Buffer Setup</h1>
          <p className="text-xs text-slate-500 mt-1">Configure your working hours and session buffer times for dynamic slot generation.</p>
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Availability"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Buffer Time Configuration */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-2">Inter-Session Buffer Time</h3>
        <p className="text-xs text-slate-500 mb-4">Minimum rest time automatically enforced between back-to-back client sessions.</p>

        <div className="flex items-center space-x-4">
          {[10, 15, 20, 30].map((mins) => (
            <button
              key={mins}
              onClick={() => setBufferTime(mins)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                bufferTime === mins
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {mins} Minutes Rest
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule Days */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 mb-4">Weekly Working Hours</h3>

        <div className="divide-y divide-slate-100">
          {DAYS.map((d) => {
            const dayConfig = weeklySchedule.find((w) => w.dayOfWeek === d.id) || {
              dayOfWeek: d.id,
              isEnabled: false,
              slots: [{ startTime: "09:00", endTime: "17:00" }],
            };

            return (
              <div key={d.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-40">
                  <input
                    type="checkbox"
                    checked={dayConfig.isEnabled}
                    onChange={() => handleToggleDay(d.id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-sm font-bold ${dayConfig.isEnabled ? "text-slate-900" : "text-slate-400"}`}>
                    {d.name}
                  </span>
                </div>

                {dayConfig.isEnabled ? (
                  <div className="flex-1 flex flex-wrap items-center gap-3">
                    {dayConfig.slots?.map((slot, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleSlotChange(d.id, idx, "startTime", e.target.value)}
                          className="bg-transparent font-semibold focus:outline-none"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleSlotChange(d.id, idx, "endTime", e.target.value)}
                          className="bg-transparent font-semibold focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Unavailable (Off Day)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
