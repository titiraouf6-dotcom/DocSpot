"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface BreakPeriod {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breaks: BreakPeriod[];
}

type WorkingHours = Record<string, DaySchedule>;

const defaultDay: DaySchedule = {
  enabled: false,
  start: "08:00",
  end: "17:00",
  breaks: [],
};

const dayLabels: Record<string, string> = {
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

const dayOrder = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

export default function DoctorSchedulePage() {
  const [workingHours, setWorkingHours] = useState<WorkingHours>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/doctor/schedule")
      .then((r) => r.json())
      .then((data) => {
        if (data.workingHours) {
          setWorkingHours(data.workingHours);
        } else {
          // Initialize with defaults
          const defaults: WorkingHours = {};
          dayOrder.forEach((day) => {
            defaults[day] = { ...defaultDay };
          });
          // Saturday-Thursday enabled by default
          ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"].forEach((day) => {
            defaults[day].enabled = true;
          });
          setWorkingHours(defaults);
        }
      })
      .catch(() => toast.error("فشل في تحميل الجدول"))
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (day: string, field: string, value: any) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const addBreak = (day: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [...(prev[day].breaks || []), { start: "13:00", end: "14:00" }],
      },
    }));
  };

  const removeBreak = (day: string, index: number) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.filter((_, i) => i !== index),
      },
    }));
  };

  const updateBreak = (day: string, index: number, field: string, value: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.map((b, i) =>
          i === index ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours }),
      });
      if (res.ok) toast.success("تم حفظ الجدول بنجاح");
      else toast.error("فشل في الحفظ");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 animate-fade-in-up">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-emerald-50 shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-3xl font-display font-extrabold text-gray-dark flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10"><Clock className="w-5 h-5 sm:w-8 sm:h-8 text-primary" /></div>
            ساعات العمل
          </h1>
          <p className="text-gray-medium text-xs sm:text-sm font-medium">قم بتنظيم جدول عيادتك وأوقات الاستراحة.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="group bg-primary text-white font-display font-bold px-6 py-2.5 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2 sm:gap-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري الحفظ...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-6 sm:h-6" />
              <span>حفظ الجدول</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Weekly Schedule List ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-6 stagger-children">
        {dayOrder.map((day) => {
          const schedule = workingHours[day] || defaultDay;
          const isEnabled = schedule.enabled;

          return (
            <div 
              key={day} 
              className={`card !p-3 sm:!p-6 group transition-all duration-500 overflow-hidden relative border-2 
                ${isEnabled ? "border-emerald-50 bg-white" : "border-gray-50 bg-gray-50/30 opacity-60"}
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 relative z-10">
                {/* Day Toggle Area */}
                <div className="flex items-center gap-3 sm:gap-5 min-w-0 sm:min-w-[200px]">
                  <label className="relative inline-flex items-center cursor-pointer group flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => updateDay(day, "enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-14 sm:h-7 bg-gray-200 rounded-full peer peer-checked:bg-primary transition-all duration-300 after:content-[''] after:absolute after:top-[3px] sm:after:top-[4px] after:start-[3px] sm:after:start-[4px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:after:translate-x-5 sm:peer-checked:after:translate-x-7 rtl:peer-checked:after:-translate-x-5 sm:rtl:peer-checked:after:-translate-x-7 shadow-inner" />
                  </label>
                  <div className="space-y-0">
                    <span className="text-sm sm:text-xl font-display font-extrabold text-gray-dark">{dayLabels[day]}</span>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-medium uppercase tracking-widest">{isEnabled ? 'يوم عمل' : 'يوم عطلة'}</p>
                  </div>
                </div>

                {isEnabled && (
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 animate-fade-in-up">
                    {/* Time Range Selector */}
                    <div className="flex items-center gap-2 sm:gap-4 bg-emerald-50/50 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 flex-1">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-1">
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => updateDay(day, "start", e.target.value)}
                          className="bg-white border-2 border-transparent focus:border-primary text-primary-dark font-extrabold py-1 px-1.5 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl transition-all outline-none text-xs sm:text-lg shadow-sm w-[5.5rem] sm:w-auto"
                          dir="ltr"
                        />
                        <span className="text-gray-400 font-bold text-xs sm:text-base">إلى</span>
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => updateDay(day, "end", e.target.value)}
                          className="bg-white border-2 border-transparent focus:border-primary text-primary-dark font-extrabold py-1 px-1.5 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl transition-all outline-none text-xs sm:text-lg shadow-sm w-[5.5rem] sm:w-auto"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Add Break Action */}
                    <button
                      onClick={() => addBreak(day)}
                      className="whitespace-nowrap px-3 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl bg-white border-2 border-dashed border-emerald-200 text-primary font-bold text-xs sm:text-sm hover:border-primary hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 sm:gap-3"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      إضافة استراحة
                    </button>
                  </div>
                )}
              </div>

              {/* Breaks Section */}
              {isEnabled && schedule.breaks && schedule.breaks.length > 0 && (
                <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-emerald-50 flex flex-wrap gap-2 sm:gap-4 animate-fade-in-up">
                  {schedule.breaks.map((brk, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 sm:gap-4 bg-gradient-to-br from-amber-50 to-orange-50/30 border-2 border-amber-100/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 sm:pr-5 group/break hover:border-amber-200 transition-all shadow-sm"
                    >
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[9px] sm:text-xs text-amber-700 font-extrabold uppercase tracking-wider hidden sm:inline">فترة استراحة</span>
                      
                      <div className="flex items-center gap-1 sm:gap-2">
                        <input
                          type="time"
                          value={brk.start}
                          onChange={(e) => updateBreak(day, idx, "start", e.target.value)}
                          className="bg-white/80 border-2 border-transparent focus:border-amber-400 text-amber-900 font-bold py-0.5 px-1.5 sm:py-1 sm:px-3 rounded-lg sm:rounded-xl transition-all outline-none text-[11px] sm:text-sm shadow-sm w-[4.5rem] sm:w-auto"
                          dir="ltr"
                        />
                        <span className="text-amber-400 text-[10px] font-bold">»</span>
                        <input
                          type="time"
                          value={brk.end}
                          onChange={(e) => updateBreak(day, idx, "end", e.target.value)}
                          className="bg-white/80 border-2 border-transparent focus:border-amber-400 text-amber-900 font-bold py-0.5 px-1.5 sm:py-1 sm:px-3 rounded-lg sm:rounded-xl transition-all outline-none text-[11px] sm:text-sm shadow-sm w-[4.5rem] sm:w-auto"
                          dir="ltr"
                        />
                      </div>

                      <button
                        onClick={() => removeBreak(day, idx)}
                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-red-50 text-red-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center shadow-sm flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
