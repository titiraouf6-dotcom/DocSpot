"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Calendar, Users, Wallet, CalendarDays, Check, X, Clock,
  TrendingUp, Info, ArrowLeft, Lock, Stethoscope, Activity, FileText,
  CheckCircle2, Phone
} from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  dateTime: string;
  attended: boolean | null;
  patient: { user: { name: string; phone: string | null } };
}

interface DashboardStats {
  todayCount: number;
  totalPatients: number;
  monthCount: number;
  walletBalance: number;
  todayAppointments: Appointment[];
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const name = session?.user?.name || "الطبيب";

  useEffect(() => {
    fetch("/api/doctor/dashboard")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => toast.error("فشل في تحميل البيانات"))
      .finally(() => setLoading(false));
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
        const data = await fetch("/api/doctor/dashboard").then((r) => r.json());
        if (!data.error) setStats(data);
      }
    } catch { toast.error("خطأ"); }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
  const formatCurrency = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";

  const getInitials = (name: string) => name.split(" ").map((w) => w.charAt(0)).slice(0, 2).join("");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
        <p className="text-gray-medium font-medium animate-pulse">جاري تحميل العيادة الافتراضية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      
      {/* ─── Welcome Hero Section ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/10 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-emerald-950 animate-pulse-slow" />
        <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-right space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
                مرحباً بك، د. {name}
              </h1>
              <span className="hidden sm:flex glass-light px-4 py-1.5 rounded-full text-xs font-bold text-white items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                العيادة نشطة الآن
              </span>
            </div>
            <p className="text-emerald-50/80 text-lg font-medium max-w-2xl leading-relaxed">
              إليك نظرة شاملة على نشاط عيادتك اليوم. يمكنك إدارة المواعيد، متابعة المرضى، وتدقيق المحفظة المالية من مكان واحد.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link href="/doctor/appointments" className="group relative bg-white text-primary-dark font-display font-bold px-10 py-4 rounded-2xl shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CalendarDays className="w-6 h-6 relative z-10 text-primary" />
              <span className="relative z-10 text-lg">عرض المواعيد</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Key Performance Indicators ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <div className="card group hover:bg-emerald-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-primary-dark/50 font-bold uppercase tracking-wider mb-0.5">مواعيد اليوم</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-dark tracking-tight">{stats?.todayCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="card group hover:bg-emerald-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-primary-dark/50 font-bold uppercase tracking-wider mb-0.5">إجمالي المرضى</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-dark tracking-tight">{stats?.totalPatients || 0}</h3>
            </div>
          </div>
        </div>

        <div className="card group hover:bg-emerald-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-primary-dark/50 font-bold uppercase tracking-wider mb-0.5">حجوزات الشهر</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-dark tracking-tight">{stats?.monthCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary-dark to-emerald-950 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold px-3 py-1 bg-white/10 rounded-full backdrop-blur-md uppercase tracking-widest border border-white/10">المحفظة</span>
            </div>
            <div>
              <p className="text-emerald-100/60 text-xs font-bold mb-1">الرصيد المتاح للسحب</p>
              <h3 className="text-3xl font-display font-extrabold tracking-tight" dir="ltr">{formatCurrency(stats?.walletBalance || 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── Today's Agenda ────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><Activity className="w-6 h-6 text-primary" /></div>
              قائمة الحضور اليوم
            </h2>
            <Link href="/doctor/appointments" className="text-primary text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-emerald-100">
              عرض الجدول الكامل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {!stats?.todayAppointments || stats.todayAppointments.length === 0 ? (
            <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-16 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <FileText className="w-10 h-10 text-emerald-200" />
              </div>
              <h3 className="text-xl font-display font-extrabold text-gray-dark mb-2">لا توجد مواعيد اليوم</h3>
              <p className="text-gray-medium text-sm max-w-xs leading-relaxed">
                عيادتك فارغة لهذا اليوم. يمكنك استخدام هذا الوقت لتطوير ملفك الشخصي أو مراجعة الحالات السابقة.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.todayAppointments.map((apt) => {
                const isPast = new Date() > new Date(apt.dateTime);
                const isPending = apt.attended === null;

                return (
                  <div
                    key={apt.id}
                    className={`card group transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden border-2 
                      ${isPending && isPast ? 'border-amber-200 bg-amber-50/10' : 'border-emerald-50 hover:border-emerald-100'}
                    `}
                  >
                    {isPending && isPast && (
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-400" />
                    )}
                    
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-white shadow-sm flex items-center justify-center text-primary-dark font-display font-extrabold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        {getInitials(apt.patient.user.name)}
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-gray-dark text-lg mb-1">{apt.patient.user.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(apt.dateTime)}
                          </span>
                          {apt.patient.user.phone && (
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1" dir="ltr">
                              <Phone className="w-3.5 h-3.5 opacity-60" />
                              {apt.patient.user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isPending ? (
                        isPast ? (
                          <div className="flex w-full sm:w-auto gap-3">
                            <button
                              onClick={() => handleAttend(apt.id, true)}
                              className="flex-1 sm:flex-none bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" /> حضر
                            </button>
                            <button
                              onClick={() => handleAttend(apt.id, false)}
                              className="flex-1 sm:flex-none bg-white text-red-600 border border-red-100 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" /> لم يحضر
                            </button>
                          </div>
                        ) : (
                          <div className="w-full text-center sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-50 text-primary-dark/60 text-sm font-bold border border-emerald-100">
                            <Lock className="w-4 h-4" />
                            بانتظار وقت الموعد
                          </div>
                        )
                      ) : (
                        <div className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-2xl border-2 
                          ${apt.attended ? "bg-emerald-50 text-primary border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}
                        `}>
                          {apt.attended ? <><CheckCircle2 className="w-5 h-5" /> تم التأكيد (حضر)</> : <><X className="w-5 h-5" /> مسجل كغائب</>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Guidelines Sidebar ────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-600">
                  <Info className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-display font-extrabold text-amber-950 text-xl">إدارة المواعيد والتعويضات</h3>
                  <p className="text-amber-900/70 text-sm leading-relaxed">
                    من المهم جداً تحديد حالة كل مريض بعد انتهاء وقت الموعد. النظام المالي يعتمد كلياً على هذا الإجراء لضمان حقوق الجميع.
                  </p>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-amber-200/50">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-primary flex-shrink-0">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-amber-950 font-bold text-sm">تم الحضور</p>
                      <p className="text-amber-900/60 text-xs">يعيد للعميل عربون الحجز ويغلق الموعد بنجاح.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-amber-950 font-bold text-sm">لم يحضر (غائب)</p>
                      <p className="text-amber-900/60 text-xs">يحول عربون المريض إلى محفظتك كتعويض مالي فوري.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
