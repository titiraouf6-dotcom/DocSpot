"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, User, Check, X, Plus, Mail, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  attended: boolean | null;
  isManual: boolean;
  insuranceAmount: number;
  patient: { user: { name: string; phone: string | null; email: string } };
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [addingManual, setAddingManual] = useState(false);
  const [filter, setFilter] = useState("all");
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [now, setNow] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update "now" every minute to keep attendance button reactivity fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!manualDate) {
      setSlots([]);
      setSlotsMsg("");
      return;
    }
    setSlotsLoading(true);
    setSlots([]);
    setSlotsMsg("");
    setManualTime(""); // reset time when date changes
    fetch(`/api/doctor/slots?date=${manualDate}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setSlotsMsg(data.error);
        else {
          setSlots(data.slots || []);
          if (data.message) setSlotsMsg(data.message);
        }
      })
      .catch(() => setSlotsMsg("خطأ في تحميل المواعيد"))
      .finally(() => setSlotsLoading(false));
  }, [manualDate]);

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(":"); const hour = parseInt(h);
    const ampm = hour >= 12 ? "م" : "ص";
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/doctor/appointments");
      if (res.ok) setAppointments(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAttend = async (id: string, attended: boolean) => {
    try {
      const res = await fetch("/api/doctor/appointment/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, attended }),
      });
      if (res.ok) {
        toast.success(attended ? "تم تأكيد الحضور" : "تم تسجيل عدم الحضور");
        fetchAppointments();
      } else toast.error("فشل في التحديث");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleManualAdd = async () => {
    if (!manualEmail || !manualDate || !manualTime) {
      toast.error("الرجاء ملء جميع الحقول");
      return;
    }
    setAddingManual(true);
    try {
      const dateTime = new Date(`${manualDate}T${manualTime}`);
      const res = await fetch("/api/doctor/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientEmail: manualEmail, dateTime: dateTime.toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم إضافة الحجز بنجاح");
        setShowManual(false);
        setManualEmail("");
        setManualDate("");
        setManualTime("");
        fetchAppointments();
      } else {
        toast.error(data.error || "فشل في الإضافة");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setAddingManual(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

  // Check if appointment time has passed
  const isTimePassed = (dateTime: string) => now > new Date(dateTime);

  // Get days in selected month
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDay = selectedDate.getDate();

  // Get appointment counts per day for the badge
  const appointmentsByDay = useMemo(() => {
    const map: Record<number, number> = {};
    appointments.forEach((a) => {
      const d = new Date(a.dateTime);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = (map[day] || 0) + 1;
      }
    });
    return map;
  }, [appointments, year, month]);

  // Filter appointments for selected day + status filter
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.dateTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [appointments, year, month, selectedDay]);

  const filtered = filter === "all" ? dayAppointments : dayAppointments.filter((a) => a.status === filter);

  // Navigation
  const goToPrevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setSelectedDate(new Date(year, month + 1, 1));
  const goToToday = () => setSelectedDate(new Date());
  const selectDay = (day: number) => setSelectedDate(new Date(year, month, day));

  const monthName = selectedDate.toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });
  const todayDate = new Date();
  const isToday = (day: number) =>
    todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === day;

  const statusLabel: Record<string, { text: string; class: string }> = {
    BOOKED: { text: "محجوز", class: "bg-blue-100 text-blue-700" },
    COMPLETED: { text: "مكتمل", class: "bg-primary/10 text-primary" },
    CANCELLED: { text: "ملغى", class: "bg-red-100 text-red-700" },
    NO_SHOW: { text: "لم يحضر", class: "bg-yellow-100 text-yellow-700" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-fade-in-up">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Calendar className="w-8 h-8 text-primary" /></div>
            سجل المواعيد
          </h1>
          <p className="text-gray-medium text-sm">إدارة المواعيد، تأكيد الحضور، وإضافة حجوزات يدوية للعيادة.</p>
        </div>
        <button onClick={() => setShowManual(true)} className="group relative bg-primary text-white font-display font-bold px-8 py-3.5 rounded-2xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden">
          <Plus className="w-6 h-6" />
          <span>إضافة حجز يدوي</span>
        </button>
      </div>

      {/* ─── Date Picker & Filters Area ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        
        {/* Day Picker */}
        <div className="lg:col-span-5 relative">
          <label className="text-xs font-bold text-primary-dark/50 mb-2 block mr-4 uppercase tracking-widest">تاريخ العرض</label>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border-2 border-emerald-50 hover:border-primary hover:shadow-lg transition-all duration-300 w-full group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-right flex-1">
              <p className="text-lg font-display font-extrabold text-gray-dark">
                {selectedDate.toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-xs text-gray-400 font-medium">{selectedDate.getFullYear()}</p>
            </div>
            <ChevronLeft className={`w-5 h-5 text-emerald-200 transition-transform duration-300 ${showDatePicker ? "rotate-90 text-primary" : ""}`} />
          </button>

          {/* Dropdown Calendar (Pro Max Style) */}
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute top-full mt-4 right-0 z-50 bg-white rounded-[2rem] shadow-2xl border border-emerald-50 p-6 w-full sm:w-[350px] animate-modal-pop">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={goToPrevMonth} className="w-10 h-10 rounded-xl bg-emerald-50 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-lg font-display font-extrabold text-gray-dark leading-tight">{monthName}</h3>
                    {!(todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === selectedDay) && (
                      <button onClick={() => { goToToday(); setShowDatePicker(false); }} className="text-xs text-primary font-bold hover:underline mt-1">
                        العودة لليوم
                      </button>
                    )}
                  </div>
                  <button onClick={goToNextMonth} className="w-10 h-10 rounded-xl bg-emerald-50 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((d) => (
                    <div key={d} className="text-center text-xs font-bold text-emerald-200 py-1 uppercase">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const count = appointmentsByDay[day] || 0;
                    const active = day === selectedDay;
                    const today = isToday(day);

                    return (
                      <button
                        key={day}
                        onClick={() => { selectDay(day); setShowDatePicker(false); }}
                        className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          active
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10"
                            : today
                            ? "bg-emerald-50 text-primary ring-2 ring-primary/20"
                            : "text-gray-dark hover:bg-emerald-50 hover:text-primary"
                        }`}
                      >
                        {day}
                        {count > 0 && (
                          <span className={`absolute -top-1 -left-1 w-5 h-5 rounded-lg text-[10px] font-extrabold flex items-center justify-center border-2 border-white ${
                            active ? "bg-emerald-400 text-white" : "bg-primary text-white shadow-sm"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status Filters */}
        <div className="lg:col-span-7">
          <label className="text-xs font-bold text-primary-dark/50 mb-2 block mr-4 uppercase tracking-widest">تصفية حسب الحالة</label>
          <div className="flex gap-2 p-1.5 bg-white border-2 border-emerald-50 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { value: "all", label: `الكل (${dayAppointments.length})` },
              { value: "BOOKED", label: "محجوز" },
              { value: "COMPLETED", label: "مكتمل" },
              { value: "NO_SHOW", label: "غائب" },
              { value: "CANCELLED", label: "ملغى" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filter === f.value 
                    ? "bg-primary text-white shadow-lg shadow-primary/10" 
                    : "text-gray-medium hover:bg-emerald-50 hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Appointments Timeline ───────────────────────────────────────── */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-24 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Calendar className="w-12 h-12 text-emerald-200" />
            </div>
            <h3 className="text-2xl font-display font-extrabold text-gray-dark mb-2">لا توجد سجلات</h3>
            <p className="text-gray-medium text-sm max-w-sm leading-relaxed">
              لم نجد أي مواعيد تطابق هذه الحالة في اليوم المختار. يمكنك اختيار يوم آخر أو إضافة حجز يدوي.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((apt) => {
              const status = statusLabel[apt.status] || statusLabel.BOOKED;
              const timePassed = isTimePassed(apt.dateTime);
              return (
                <div key={apt.id} className="card group transition-all duration-300 hover:border-emerald-100 border-2 border-transparent">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-white shadow-sm flex items-center justify-center text-primary-dark font-display font-extrabold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        {apt.patient.user.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-display font-extrabold text-gray-dark">{apt.patient.user.name}</p>
                          {apt.isManual && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-widest border border-purple-200">يدوي</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-xs font-bold text-primary-dark/60 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {formatDate(apt.dateTime)}
                          </span>
                          <span className="text-xs font-extrabold text-primary flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            {formatTime(apt.dateTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                      <div className="flex flex-col items-end">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border ${status.class}`}>
                          {status.text}
                        </span>
                        {apt.status === "BOOKED" && timePassed && (
                          <p className="text-[10px] text-amber-600 font-bold mt-1 animate-pulse">بانتظار تأكيد الحضور</p>
                        )}
                      </div>

                      <div className="h-10 w-px bg-emerald-50 hidden lg:block" />

                      <div className="flex items-center gap-3">
                        {apt.status === "BOOKED" && apt.attended === null && (
                          timePassed ? (
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleAttend(apt.id, true)} 
                                className="bg-primary text-white p-3 rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                title="تأكيد الحضور"
                              >
                                <Check className="w-5 h-5" />
                                <span className="text-xs font-bold sm:inline hidden">حضر</span>
                              </button>
                              <button 
                                onClick={() => handleAttend(apt.id, false)} 
                                className="bg-white text-red-600 border border-red-100 p-3 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
                                title="تسجيل غياب"
                              >
                                <X className="w-5 h-5" />
                                <span className="text-xs font-bold sm:inline hidden">لم يحضر</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 text-primary-dark/40 text-xs font-bold border border-emerald-100">
                              <Lock className="w-4 h-4" />
                              يفتح بعد وقت الموعد
                            </div>
                          )
                        )}
                        {apt.attended !== null && (
                           <div className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold border-2 ${apt.attended ? "bg-emerald-50 text-primary border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                             {apt.attended ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                             {apt.attended ? "تم الحضور" : "مسجل كغائب"}
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Manual Add Modal ────────────────────────────────────────────── */}
      {showManual && (
        <div className="fixed inset-0 bg-primary-dark/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-down" onClick={() => setShowManual(false)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-modal-pop" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-10 pt-10 pb-6 bg-gradient-to-br from-white to-emerald-50/30 flex items-center justify-between border-b border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-gray-dark tracking-tight">إضافة حجز يدوي</h3>
                  <p className="text-sm text-gray-medium font-medium">سجل مريضاً في عيادتك خارج المنصة</p>
                </div>
              </div>
              <button 
                onClick={() => setShowManual(false)} 
                className="p-3 rounded-2xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {/* Form Content */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-dark mb-2 block mr-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> البريد الإلكتروني للمريض
                  </label>
                  <input 
                    type="email" 
                    value={manualEmail} 
                    onChange={(e) => setManualEmail(e.target.value)} 
                    className="input-field py-4 text-lg font-bold" 
                    placeholder="patient@email.com" 
                    dir="ltr" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-gray-dark mb-2 block mr-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> التاريخ
                    </label>
                    <input 
                      type="date" 
                      value={manualDate} 
                      onChange={(e) => setManualDate(e.target.value)} 
                      className="input-field py-4 font-bold" 
                      dir="ltr" 
                      min={new Date().toISOString().split("T")[0]} 
                    />
                  </div>

                  {manualDate && (
                    <div className="animate-fade-in-up">
                      <label className="text-sm font-bold text-gray-dark mb-2 block mr-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> الوقت المتاح
                      </label>
                      <div className="relative">
                        {slotsLoading ? (
                          <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent shadow-sm" /></div>
                        ) : slotsMsg && slots.length === 0 ? (
                          <div className="text-center py-4 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-100">
                            <p className="text-emerald-800 text-xs font-bold">{slotsMsg}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {slots.map((slot) => {
                              const isSelected = manualTime === slot.time;
                              return (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => setManualTime(slot.time)}
                                  className={`py-3 px-2 rounded-xl text-xs font-extrabold transition-all duration-300 border-2
                                    ${!slot.available ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : ""}
                                    ${slot.available && !isSelected ? "border-emerald-50 text-gray-dark hover:border-primary hover:bg-emerald-50" : ""}
                                    ${isSelected ? "!bg-primary !text-white !border-primary shadow-lg shadow-primary/20 scale-105" : ""}
                                  `}
                                >
                                  {formatTime12(slot.time)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleManualAdd}
                  disabled={addingManual}
                  className="group relative bg-primary text-white font-display font-bold w-full py-5 rounded-[1.5rem] shadow-2xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <Plus className="w-7 h-7" />
                  <span className="text-xl">{addingManual ? "جاري الحفظ..." : "تأكيد إضافة الحجز"}</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
