"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, User, XCircle, Star, CheckCircle, ChevronRight, ChevronLeft, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ReviewStars } from "@/components/ReviewStars";
import Link from "next/link";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  insuranceAmount: number;
  attended: boolean | null;
  cancellationDeadline: string;
  doctor: { id: string; profileImageUrl: string | null; user: { name: string; image?: string | null }; specialization: string };
  review: { id: string; ratingClinic: number; ratingService: number; comment: string | null } | null;
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [ratingClinic, setRatingClinic] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cancelModal, setCancelModal] = useState<{ id: string; type: "early" | "late"; amount: number } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/patient/appointments");
      if (res.ok) setAppointments(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelClick = async (apt: Appointment) => {
    const isBeforeDeadline = new Date(apt.cancellationDeadline) > new Date();
    if (isBeforeDeadline) {
      setCancelModal({ id: apt.id, type: "early", amount: apt.insuranceAmount });
    } else {
      setCancelModal({ id: apt.id, type: "late", amount: apt.insuranceAmount });
    }
  };

  const confirmCancel = async () => {
    if (!cancelModal) return;
    setCancelLoading(true);
    try {
      const forceParam = cancelModal.type === "late" ? "&force=true" : "";
      const res = await fetch(`/api/patient/appointment?id=${cancelModal.id}${forceParam}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        if (data.refunded) {
          toast.success("تم إلغاء الموعد واسترجاع مبلغ التأمين");
        } else {
          toast.success("تم إلغاء الموعد. تم خصم مبلغ التأمين.");
        }
        fetchAppointments();
      } else {
        toast.error(data.error || "فشل في الإلغاء");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setCancelLoading(false);
      setCancelModal(null);
    }
  };

  const handleReview = async () => {
    if (!reviewModal || ratingClinic === 0 || ratingService === 0) {
      toast.error("الرجاء تقييم العيادة والخدمة");
      return;
    }
    try {
      const res = await fetch("/api/patient/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: reviewModal, ratingClinic, ratingService, comment }),
      });
      if (res.ok) {
        toast.success("شكراً على تقييمك!");
        setReviewModal(null);
        setRatingClinic(0);
        setRatingService(0);
        setComment("");
        fetchAppointments();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل في التقييم");
      }
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
  const canCancel = (dateTime: string) => new Date(dateTime) > new Date();

  // Date picker logic
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDay = selectedDate.getDate();

  const goToPrevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setSelectedDate(new Date(year, month + 1, 1));
  const goToToday = () => setSelectedDate(new Date());
  const selectDay = (day: number) => setSelectedDate(new Date(year, month, day));

  const monthName = selectedDate.toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });
  const todayDate = new Date();
  const isToday = (day: number) =>
    todayDate.getFullYear() === year && todayDate.getMonth() === month && todayDate.getDate() === day;

  // Appointment counts per day
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

  // Filter appointments for selected day
  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.dateTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [appointments, year, month, selectedDay]);

  const filtered = filter === "all" ? dayAppointments : dayAppointments.filter((a) => a.status === filter);

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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-10 md:p-14 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse-slow" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <Calendar className="w-8 h-8 text-emerald-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">جدول المواعيد</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight leading-tight">
            إدارة <span className="text-emerald-300">مواعيدك</span>
          </h1>
          <p className="text-emerald-200/60 text-sm font-medium mt-3">تصفح مواعيدك وتابع حالة كل زيارة بسهولة.</p>
        </div>
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

          {/* Dropdown Calendar */}
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute top-full mt-4 right-0 z-50 bg-white rounded-[2rem] shadow-2xl border border-emerald-50 p-6 w-full sm:w-[350px] animate-fade-in-up">
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
              { value: "NO_SHOW", label: "لم يحضر" },
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

      {/* ─── Appointments List ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-32 text-center flex flex-col items-center justify-center rounded-[2.5rem]">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
            <Calendar className="w-12 h-12 text-emerald-200" />
          </div>
          <h3 className="text-2xl font-display font-extrabold text-emerald-950 mb-2">لا توجد مواعيد</h3>
          <p className="text-emerald-900/50 text-base max-w-sm leading-relaxed">
            لا توجد مواعيد مسجلة ليوم {selectedDate.toLocaleDateString("ar-DZ", { day: "numeric", month: "long" })} تحت هذا التصنيف.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 stagger-children">
          {filtered.map((apt) => {
            const status = statusLabel[apt.status] || statusLabel.BOOKED;
            const canCancelApt = canCancel(apt.dateTime);
            return (
              <div key={apt.id} className="card group border-2 border-emerald-50/50 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <Link href={`/patient/doctor/${apt.doctor.id}`} className="flex items-center gap-6 cursor-pointer relative z-10">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-emerald-900 to-emerald-950 border-4 border-white shadow-xl flex items-center justify-center text-white font-display font-black text-2xl flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
                      {apt.doctor.profileImageUrl ? (
                        <img src={apt.doctor.profileImageUrl} alt={apt.doctor.user.name} className="w-full h-full object-cover" />
                      ) : apt.doctor.user.image ? (
                        <img src={apt.doctor.user.image} alt={apt.doctor.user.name} className="w-full h-full object-cover" />
                      ) : (
                        apt.doctor.user.name.charAt(0)
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-2xl font-display font-extrabold text-emerald-950 hover:text-primary transition-colors">د. {apt.doctor.user.name}</h3>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.class} shadow-sm`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-base font-bold text-emerald-600/70">{apt.doctor.specialization}</p>
                      <div className="flex flex-wrap gap-4 pt-2">
                        <span className="text-xs font-black text-emerald-900/40 flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/30">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          {formatDate(apt.dateTime)}
                        </span>
                        <span className="text-xs font-black text-primary flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/30">
                          <Clock className="w-4 h-4" />
                          {formatTime(apt.dateTime)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 lg:self-center">
                    {apt.status === "BOOKED" && canCancelApt && (
                      <button
                        onClick={() => handleCancelClick(apt)}
                        className="bg-red-50 text-red-600 font-display font-bold px-8 py-4 rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 flex items-center gap-3 shadow-sm"
                      >
                        <XCircle className="w-5 h-5" />
                        إلغاء الموعد
                      </button>
                    )}

                    {apt.status === "COMPLETED" && !apt.review && (
                      <button
                        onClick={() => setReviewModal(apt.id)}
                        className="bg-primary text-white font-display font-bold px-10 py-4 rounded-2xl shadow-xl hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
                      >
                        <Star className="w-5 h-5" />
                        تقييم التجربة
                      </button>
                    )}

                    {apt.review && (
                      <div className="flex items-center gap-3 bg-emerald-50 px-6 py-4 rounded-2xl border border-emerald-100">
                        <CheckCircle className="w-6 h-6 text-primary" />
                        <span className="text-sm font-display font-black text-emerald-900">تم التقييم بنجاح</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ────────────────────────────────────────────────────── */}
      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-emerald-950/20 animate-fade-in" onClick={() => !cancelLoading && setCancelModal(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-emerald-100" onClick={(e) => e.stopPropagation()} style={{ animation: "modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <div className={`p-10 text-center ${cancelModal.type === "late" ? "bg-red-50/30" : "bg-emerald-50/30"}`}>
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-slow ${cancelModal.type === "late" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                {cancelModal.type === "late" ? <AlertTriangle className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
              </div>
              <h3 className="text-2xl font-display font-extrabold text-emerald-950 mb-3">
                {cancelModal.type === "late" ? "تنبيه: إلغاء متأخر" : "تأكيد الإلغاء"}
              </h3>
              <p className="text-emerald-900/60 font-medium leading-relaxed mb-6">
                {cancelModal.type === "late" 
                  ? "لقد تجاوزت مهلة الإلغاء المجاني (24 ساعة). سيتم خصم مبلغ التأمين ولن يتم استرجاعه."
                  : "هل أنت متأكد من رغبتك في إلغاء الموعد؟ سيتم استرجاع كامل مبلغ التأمين إلى محفظتك."}
              </p>
              
              <div className={`rounded-2xl p-4 flex items-center justify-between gap-4 border ${cancelModal.type === "late" ? "bg-red-100/50 border-red-200" : "bg-emerald-100/50 border-emerald-200"}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">قيمة التأمين</span>
                <span className={`text-xl font-display font-black ${cancelModal.type === "late" ? "text-red-700" : "text-emerald-700"}`}>
                  {cancelModal.amount.toLocaleString("ar-DZ")} <span className="text-xs">د.ج</span>
                </span>
              </div>
            </div>
            
            <div className="p-8 flex gap-4">
              <button
                onClick={confirmCancel}
                disabled={cancelLoading}
                className={`flex-1 py-5 rounded-[1.25rem] font-display font-black text-white shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 ${cancelModal.type === "late" ? "bg-red-600 hover:bg-red-700 shadow-red-900/10" : "bg-primary hover:bg-primary-dark shadow-emerald-900/10"}`}
              >
                {cancelLoading ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
              </button>
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelLoading}
                className="flex-1 py-5 rounded-[1.25rem] font-display font-black text-emerald-900/40 hover:bg-emerald-50 transition-all active:scale-95"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-emerald-950/20 animate-fade-in" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-emerald-100" onClick={(e) => e.stopPropagation()} style={{ animation: "modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <div className="p-10 bg-emerald-50/30 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Star className="w-10 h-10 text-primary fill-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-display font-extrabold text-emerald-950">تقييم زيارتك</h3>
              <p className="text-emerald-900/60 text-sm font-medium mt-2">رأيك يهمنا ويساعد الآخرين في اختيار الطبيب المناسب</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                  <ReviewStars label="تقييم العيادة" value={ratingClinic} onChange={setRatingClinic} />
                </div>
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                  <ReviewStars label="تقييم جودة الخدمة" value={ratingService} onChange={setRatingService} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2">تعليقك (اختياري)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl p-5 text-emerald-950 font-medium placeholder:text-emerald-900/20 focus:bg-white focus:border-primary transition-all outline-none min-h-[120px] resize-none"
                    placeholder="كيف كانت تجربتك مع الطبيب والعيادة؟"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button onClick={handleReview} className="flex-1 bg-primary text-white font-display font-black py-5 rounded-[1.25rem] shadow-xl shadow-emerald-900/10 hover:bg-primary-dark transition-all active:scale-95">
                  إرسال التقييم
                </button>
                <button onClick={() => setReviewModal(null)} className="flex-1 py-5 rounded-[1.25rem] font-display font-black text-emerald-900/40 hover:bg-emerald-50 transition-all active:scale-95">
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
