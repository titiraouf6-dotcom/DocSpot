"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  MapPin, Star, Shield, Clock, Calendar, ExternalLink, X,
  Phone, FileText, Stethoscope, ChevronLeft, ChevronRight, Award, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface DoctorDetail {
  id: string; name: string; specialization: string; wilaya: string;
  commune: string; about: string | null; bio: string | null;
  insuranceAmount: number; profileImageUrl: string | null;
  avgRating: number; reviewCount: number; googleMapsLink: string;
  phone: string | null; workingHours: any;
}

interface TimeSlot { time: string; available: boolean; reason?: string; }

const dayNames: Record<string, string> = {
  sunday: "الأحد", monday: "الإثنين", tuesday: "الثلاثاء",
  wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة", saturday: "السبت",
};
const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const arabicDaysShort = ["أحد","إثن","ثلا","أرب","خمي","جمع","سبت"];

export default function DoctorProfilePage() {
  const params = useParams();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState("");
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  useEffect(() => {
    fetch(`/api/patient/search?doctorId=${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setDoctor(data[0]);
        else if (data && !Array.isArray(data)) setDoctor(data);
      })
      .catch(() => toast.error("فشل في تحميل بيانات الطبيب"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const today = now.getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const isDayDisabled = (day: number) => {
    if (day < today) return true;
    if (!doctor?.workingHours) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const dayKey = dayMap[date.getDay()];
    const schedule = doctor.workingHours[dayKey];
    return !schedule || !schedule.enabled;
  };

  const getDayName = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dayMap = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    return dayNames[dayMap[date.getDay()]];
  };

  useEffect(() => {
    if (selectedDay === null || !doctor) return;
    setSlotsLoading(true);
    setSlots([]);
    setSlotsMsg("");
    setSelectedTime("");
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    fetch(`/api/patient/slots?doctorId=${doctor.id}&date=${dateStr}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.slots || []);
        if (data.message) setSlotsMsg(data.message);
      })
      .catch(() => setSlotsMsg("خطأ في تحميل المواعيد"))
      .finally(() => setSlotsLoading(false));
  }, [selectedDay, doctor, currentYear, currentMonth]);

  const handleBooking = async () => {
    if (!selectedDay || !selectedTime || !doctor) return;
    setBooking(true);
    try {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      const dateTime = new Date(`${dateStr}T${selectedTime}:00`);
      const res = await fetch("/api/patient/appointment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: params.id, dateTime: dateTime.toISOString() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم حجز الموعد بنجاح!");
        setShowConfirm(false); setShowBooking(false);
        setSelectedDay(null); setSelectedTime("");
      } else toast.error(data.error || "فشل في الحجز");
    } catch { toast.error("حدث خطأ"); } finally { setBooking(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";
  const formatTime12 = (t: string) => {
    const [h, m] = t.split(":"); const hour = parseInt(h);
    const ampm = hour >= 12 ? "م" : "ص";
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  if (!doctor) return <div className="text-center py-16"><p className="text-gray-medium text-lg font-display">لم يتم العثور على الطبيب</p></div>;

  const selectedDateFull = selectedDay ? new Date(currentYear, currentMonth, selectedDay).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <div className="space-y-8 max-w-6xl mx-auto page-enter">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-emerald-900 animate-pulse-slow" />
        <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-white/40 to-transparent shadow-xl">
                {doctor.profileImageUrl ? (
                  <img src={doctor.profileImageUrl} alt={doctor.name} className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl" />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-6xl font-bold text-white shadow-2xl backdrop-blur-md">
                    {doctor.name.charAt(0)}
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-white rounded-full p-1.5 shadow-xl ring-4 ring-primary-dark/10">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="text-center md:text-right flex-1 text-white space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">د. {doctor.name}</h1>
                <p className="text-emerald-100 text-lg font-medium opacity-90">{doctor.specialization}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="glass px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 text-primary-dark shadow-sm">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  {doctor.avgRating > 0 ? doctor.avgRating : "جديد"}
                  <span className="text-primary-dark/60 font-normal">({doctor.reviewCount} تقييم)</span>
                </span>
                <span className="glass px-4 py-1.5 rounded-full text-sm font-semibold text-primary-dark flex items-center gap-2 shadow-sm">
                  <Award className="w-4 h-4 text-primary" />
                  حساب موثّق
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-emerald-50/80 text-sm font-medium">
                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-300" />{doctor.wilaya} — {doctor.commune}</span>
                {doctor.phone && <span className="flex items-center gap-2"><Phone className="w-5 h-5 text-emerald-300" />{doctor.phone}</span>}
              </div>
            </div>

            {/* Action */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => setShowBooking(true)} 
                className="group relative bg-white text-primary-dark font-bold px-10 py-4 rounded-2xl shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Calendar className="w-6 h-6 relative z-10 text-primary" />
                <span className="relative z-10 text-lg">احجز موعداً الآن</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 stagger-children">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card group hover:bg-emerald-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary-dark group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-primary-dark/60 font-bold uppercase tracking-wider">مبلغ الضمان</p>
                  <p className="text-xl font-display font-bold text-gray-dark">{fmt(doctor.insuranceAmount)}</p>
                </div>
              </div>
            </div>
            <div className="card group hover:bg-amber-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-xs text-amber-700/60 font-bold uppercase tracking-wider">التقييم العام</p>
                  <p className="text-xl font-display font-bold text-gray-dark">{doctor.avgRating > 0 ? doctor.avgRating : "—"}</p>
                </div>
              </div>
            </div>
            <div className="card group hover:bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-primary-dark/60 font-bold uppercase tracking-wider">الحالة</p>
                  <p className="text-xl font-display font-bold text-gray-dark">موثّق</p>
                </div>
              </div>
            </div>
          </div>

          {/* About & Bio Section */}
          {(doctor.about || doctor.bio) && (
            <section className="card bg-gradient-to-br from-white to-emerald-50/10 space-y-6">
              <h3 className="text-xl font-display font-bold text-gray-dark flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
                السيرة والوصف
              </h3>

              {doctor.about && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-primary"></span>
                    <h4 className="font-display font-bold text-primary">نبذة تعريفية</h4>
                  </div>
                  <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap font-sans">{doctor.about}</p>
                  </div>
                </div>
              )}

              {doctor.bio && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-primary"></span>
                    <h4 className="font-display font-bold text-primary">المؤهلات والخبرات</h4>
                  </div>
                  <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap font-sans">{doctor.bio}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Working Hours */}
          {doctor.workingHours && (
            <section className="card">
              <h3 className="text-xl font-display font-bold text-gray-dark mb-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Clock className="w-5 h-5 text-primary" /></div>
                أوقات العمل المتاحة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(doctor.workingHours).map(([day, schedule]: [string, any]) => (
                  <div key={day} className={`group flex items-center justify-between py-4 px-6 rounded-2xl border transition-all ${schedule.enabled ? "bg-white border-emerald-100 shadow-sm hover:border-primary hover:shadow-md" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${schedule.enabled ? "bg-primary animate-pulse" : "bg-gray-300"}`} />
                      <span className={`font-bold ${schedule.enabled ? "text-gray-dark" : "text-gray-400"}`}>{dayNames[day] || day}</span>
                    </div>
                    {schedule.enabled ? (
                      <span className="text-primary font-bold text-lg" dir="ltr">{schedule.start} - {schedule.end}</span>
                    ) : (
                      <span className="text-gray-400 text-sm font-medium">مغلق</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Location Card */}
          <section className="card overflow-hidden p-0 border-primary/10">
            <div className="p-6">
              <h3 className="text-xl font-display font-bold text-gray-dark mb-2 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
                الموقع والعيادة
              </h3>
              <p className="text-gray-medium text-lg mr-11">{doctor.wilaya} — {doctor.commune}</p>
            </div>
            <div className="bg-emerald-50/50 p-6 border-t border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm"><ExternalLink className="w-5 h-5 text-primary" /></div>
                <span className="text-primary-dark font-medium">افتح الموقع في خرائط Google</span>
              </div>
              <a href={doctor.googleMapsLink} target="_blank" rel="noopener noreferrer" 
                className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/20">
                توجيه المسار
              </a>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="card bg-white border-2 border-primary/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <h3 className="text-xl font-display font-bold text-gray-dark mb-4">احجز الآن</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 text-sm font-bold">ضمان حضور</p>
                      <p className="text-amber-700/80 text-xs">سيتم تجميد {fmt(doctor.insuranceAmount)} من رصيدك لضمان الجدية.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-primary-dark text-sm font-bold">تذكير بالموعد</p>
                      <p className="text-primary-dark/80 text-xs">سيصلك اشعار تذكير عند اقتراب موعد الحجز.</p>
                    </div>
                  </div>
                </div>

                  <button 
                    onClick={() => setShowBooking(true)} 
                    className="btn-primary w-full py-4 text-lg font-bold shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    <Calendar className="w-6 h-6" />
                    بدء عملية الحجز
                  </button>
              </div>
            </div>

            {/* Trusted Badge */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary-dark to-emerald-950 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-4c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm13-46c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg">آمن ومضمون</h4>
                  <p className="text-emerald-100/60 text-xs">حماية بياناتك وأموالك هي أولويتنا.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Booking Modal ────────────────────────────────────────────── */}
      {showBooking && (
        <div className="fixed inset-0 bg-primary-dark/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-slide-down" onClick={() => { setShowBooking(false); setSelectedDay(null); setSelectedTime(""); }}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-modal-pop" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4 bg-gradient-to-br from-white to-emerald-50/30 flex items-center justify-between border-b border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-gray-dark">حجز موعد جديد</h3>
                  <p className="text-sm text-gray-medium">اختر الوقت المناسب لك</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowBooking(false); setSelectedDay(null); setSelectedTime(""); }} 
                className="p-2.5 rounded-2xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Doctor Mini Profile */}
              <div className="p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                {doctor.profileImageUrl ? (
                  <img src={doctor.profileImageUrl} alt={doctor.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl">{doctor.name.charAt(0)}</div>
                )}
                <div>
                  <p className="font-display font-bold text-gray-dark">د. {doctor.name}</p>
                  <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                </div>
              </div>

              {/* Day Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-lg text-gray-dark flex items-center gap-2">
                    ١. اختر اليوم
                  </h4>
                  <div className="px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {arabicMonths[currentMonth]} {currentYear}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {arabicDaysShort.map(d => <div key={d} className="text-center text-xs text-primary-dark/40 font-bold py-1 uppercase">{d}</div>)}
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} className="h-12" />;
                    const disabled = isDayDisabled(day);
                    const selected = selectedDay === day;
                    const isToday = day === today;
                    return (
                      <button 
                        key={day} 
                        disabled={disabled} 
                        onClick={() => { setSelectedDay(day); setSelectedTime(""); }}
                        className={`relative h-12 rounded-2xl text-base font-bold transition-all duration-300
                          ${disabled ? "text-gray-200 bg-gray-50/50 cursor-not-allowed" : "hover:bg-primary/10 hover:scale-110 active:scale-95"}
                          ${selected ? "!bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/20 scale-110 z-10" : ""}
                          ${isToday && !selected ? "text-primary border-2 border-primary/20 bg-emerald-50/50" : ""}
                          ${!disabled && !selected ? "text-gray-dark bg-white border border-gray-100" : ""}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Selection */}
              {selectedDay !== null && (
                <div className="space-y-4 animate-slide-down">
                  <h4 className="font-display font-bold text-lg text-gray-dark flex items-center gap-2">
                    ٢. اختر الوقت المفضل <span className="text-sm text-primary font-medium mr-2">— {getDayName(selectedDay)}</span>
                  </h4>

                  {slotsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
                      <p className="text-gray-400 font-medium">جاري جلب المواعيد المتاحة...</p>
                    </div>
                  ) : slotsMsg && slots.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">{slotsMsg}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {slots.map(slot => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button 
                            key={slot.time} 
                            disabled={!slot.available} 
                            onClick={() => setSelectedTime(slot.time)}
                            className={`group relative py-4 px-3 rounded-2xl text-base font-extrabold transition-all duration-300 border-2
                              ${!slot.available ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" : "hover:border-primary hover:bg-emerald-50 hover:scale-[1.02]"}
                              ${isSelected ? "!bg-primary !text-white !border-primary shadow-xl shadow-primary/20 scale-105" : "bg-white border-gray-100 text-gray-dark"}
                            `}
                          >
                            <span dir="ltr">{formatTime12(slot.time)}</span>
                            {!slot.available && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/40 rounded-2xl">
                                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                  {slot.reason === "break" ? "استراحة" : slot.reason === "booked" ? "محجوز" : "غير متاح"}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedDay || !selectedTime}
                  className="btn-primary w-full py-5 text-xl font-extrabold shadow-primary/30 flex items-center justify-center gap-4 transition-all"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  تأكيد الموعد المختار
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal ────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-primary-dark/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-modal-pop">
            <div className="bg-gradient-to-br from-primary to-primary-dark p-10 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-[2rem] backdrop-blur-xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-2xl">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-display font-extrabold">مراجعة الحجز</h3>
                <p className="text-emerald-100 mt-2 font-medium">خطوة واحدة متبقية لتأكيد موعدك</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4 p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="flex justify-between items-center"><span className="text-gray-medium font-medium">الطبيب</span><span className="font-extrabold text-gray-dark text-lg">د. {doctor.name}</span></div>
                <div className="h-px bg-gray-200 w-full" />
                <div className="flex justify-between items-center"><span className="text-gray-medium font-medium">التاريخ</span><span className="font-extrabold text-gray-dark">{selectedDateFull}</span></div>
                <div className="h-px bg-gray-200 w-full" />
                <div className="flex justify-between items-center"><span className="text-gray-medium font-medium">الوقت</span><span className="font-extrabold text-primary text-xl" dir="ltr">{selectedTime && formatTime12(selectedTime)}</span></div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm leading-relaxed">
                  سيتم حجز مبلغ <span className="font-bold underline">{fmt(doctor.insuranceAmount)}</span> كضمان. 
                  سيتم إرجاع المبلغ فوراً بعد إتمام الزيارة أو الإلغاء المبكر.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBooking} 
                  disabled={booking} 
                  className="btn-primary flex-[2] py-4 text-lg font-bold shadow-primary/20"
                >
                  {booking ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>جاري الحجز...</span>
                    </div>
                  ) : "تأكيد الحجز"}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="btn-outline flex-1 py-4 text-lg font-bold"
                >
                  تعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
