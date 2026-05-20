"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Wallet, Calendar, Clock, User, Search, ArrowLeft, TrendingUp, HeartPulse, ShieldCheck, CreditCard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Appointment {
  id: string; dateTime: string; status: string;
  doctor: { user: { name: string }; specialization: string };
}
interface WalletData { walletAvailable: number; walletFrozen: number; }

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const patientName = session?.user?.name || "المريض";

  useEffect(() => {
    Promise.all([
      fetch("/api/patient/wallet").then((r) => r.json()),
      fetch("/api/patient/appointments").then((r) => r.json()),
    ]).then(([w, a]) => {
      if (w && !w.error) setWallet(w);
      if (Array.isArray(a)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = a
          .filter((apt) => new Date(apt.dateTime) >= today)
          .sort((x, y) => new Date(x.dateTime).getTime() - new Date(y.dateTime).getTime());
        setAppointments(upcoming.slice(0, 5));
      }
    }).catch(() => toast.error("فشل تحميل البيانات")).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { month: "long", day: "numeric", weekday: "long" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

  const getInitials = (name: string) => name.split(" ").map(w => w.charAt(0)).slice(0, 2).join("");

  const statusLabel: Record<string, { text: string; cls: string; dot: string }> = {
    BOOKED: { text: "قادم", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    COMPLETED: { text: "مكتمل", cls: "bg-emerald-50 text-primary-dark border-emerald-200", dot: "bg-primary" },
    CANCELLED: { text: "ملغى", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
    NO_SHOW: { text: "لم يحضر", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="relative w-14 h-14">
        <div className="w-14 h-14 border-4 border-gray-100 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
      </div>
      <p className="text-gray-medium font-medium">جاري تحضير ملفك...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* ─── Hero Welcome & Wallet Card ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Welcome Section */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950" />
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          
          <div className="relative p-7 md:p-9 flex flex-col h-full justify-between gap-5 z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="glass-light px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-sm border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مرحباً بعودتك
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight leading-tight mb-2">
                صحتك في أمان، <br />{patientName}
              </h1>
              <p className="text-emerald-50/70 text-sm font-medium max-w-xl leading-relaxed">
                نتمنى لك دوام الصحة والعافية. يمكنك الآن تصفح أفضل الأطباء المتخصصين وحجز موعدك في دقائق.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/patient/search" className="group relative bg-white text-emerald-950 font-display font-black px-7 py-3 rounded-xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2 overflow-hidden text-sm">
                <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Search className="w-5 h-5 relative z-10 text-emerald-600" />
                <span className="relative z-10">بحث عن طبيب</span>
              </Link>
              <Link href="/patient/appointments" className="glass-light text-white font-display font-bold px-7 py-3 rounded-xl border border-white/20 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-2 text-sm">
                <Calendar className="w-5 h-5 text-emerald-300" />
                <span>مواعيدي</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Wallet Digital Card */}
        <div className="lg:col-span-4 relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 to-emerald-900 p-7 text-white shadow-2xl border border-white/5 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] -mr-24 -mt-24 animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-[30px] -ml-12 -mb-12" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
              <Wallet className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-[9px] font-black px-3 py-1 bg-white/10 rounded-full backdrop-blur-md uppercase tracking-widest border border-white/10">المحفظة الصحية</span>
          </div>
          
          <div className="relative z-10 mt-6">
            <div className="space-y-1">
              <p className="text-emerald-300/60 text-[10px] font-bold uppercase tracking-widest">الرصيد المتاح</p>
              <h2 className="text-4xl font-display font-extrabold tracking-tight drop-shadow-xl" dir="ltr">
                {wallet?.walletAvailable.toLocaleString('ar-DZ')} <span className="text-base text-emerald-300">د.ج</span>
              </h2>
            </div>
            
            {wallet && wallet.walletFrozen > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-sm -mx-3 px-3 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-100/60 uppercase tracking-tight">رصيد معلق</span>
                </div>
                <span className="text-base font-display font-black text-amber-400" dir="ltr">{wallet.walletFrozen.toLocaleString('ar-DZ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Quick Actions Grid ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-extrabold text-gray-dark flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10 shadow-sm"><HeartPulse className="w-7 h-7 text-primary" /></div>
          الخدمات السريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
          {[
            { href: "/patient/search", icon: Search, label: "بحث وحجز", sub: "تصفح التخصصات", color: "emerald", border: "hover:border-emerald-200", bg: "bg-emerald-50" },
            { href: "/patient/wallet", icon: CreditCard, label: "شحن المحفظة", sub: "إضافة رصيد", color: "blue", border: "hover:border-blue-200", bg: "bg-blue-50" },
            { href: "/patient/appointments", icon: Calendar, label: "مواعيدي", sub: "إدارة الحجوزات", color: "purple", border: "hover:border-purple-200", bg: "bg-purple-50" },
            { href: "/patient/settings", icon: User, label: "الملف الشخصي", sub: "بياناتك الصحية", color: "amber", border: "hover:border-amber-200", bg: "bg-amber-50" },
          ].map((item, idx) => (
            <Link key={idx} href={item.href} className={`card group hover:scale-[1.03] active:scale-95 transition-all duration-300 border-2 border-emerald-50/50 ${item.border} text-center flex flex-col items-center justify-center gap-4`}>
              <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-gray-dark text-base">{item.label}</h3>
                <p className="text-[10px] font-bold text-gray-medium uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Upcoming Appointments Timeline ────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-extrabold text-gray-dark flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10 shadow-sm"><Clock className="w-7 h-7 text-primary" /></div>
            مواعيدك القادمة
          </h2>
          <Link href="/patient/appointments" className="text-primary text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 px-5 py-2.5 rounded-2xl transition-all border border-transparent hover:border-emerald-100">
            عرض كل المواعيد <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-24 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Calendar className="w-12 h-12 text-emerald-200" />
            </div>
            <h3 className="text-2xl font-display font-extrabold text-gray-dark mb-2">لا توجد مواعيد حالياً</h3>
            <p className="text-gray-medium text-sm max-w-sm leading-relaxed mb-8">
              يمكنك البدء بالبحث عن الطبيب المناسب وحجز موعدك الأول بضغطة زر واحدة.
            </p>
            <Link href="/patient/search" className="bg-primary text-white font-display font-bold px-10 py-4 rounded-2xl shadow-xl hover:bg-primary-dark transition-all scale-100 hover:scale-105">
              ابدأ البحث الآن
            </Link>
          </div>
        ) : (
          <div className="card border-2 border-emerald-50/50 p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-[80px] -mr-32 -mt-32" />
            
            <div className="relative space-y-10">
              {appointments.map((apt, index) => {
                const st = statusLabel[apt.status] || statusLabel.BOOKED;
                return (
                  <div key={apt.id} className="relative flex gap-8 group">
                    {/* Timeline Line */}
                    {index !== appointments.length - 1 && (
                      <div className="absolute top-14 bottom-[-40px] right-[31px] w-1 bg-emerald-50 group-hover:bg-primary/20 transition-all rounded-full" />
                    )}
                    
                    {/* Date Bubble */}
                    <div className="relative z-10 flex flex-col items-center w-16 pt-1">
                      <div className="w-16 h-16 bg-white border-4 border-emerald-50 rounded-[1.5rem] flex flex-col items-center justify-center text-primary shadow-sm group-hover:scale-110 group-hover:border-primary/20 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">{formatDate(apt.dateTime).split(' ')[0]}</span>
                        <span className="text-2xl font-display font-black leading-none">{new Date(apt.dateTime).getDate()}</span>
                      </div>
                    </div>

                    {/* Appointment Card */}
                    <div className="flex-1 bg-white hover:bg-emerald-50/20 border-2 border-emerald-50 rounded-[2rem] p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 flex flex-col md:flex-row md:items-center justify-between gap-8 group/card">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-emerald-900 to-emerald-950 border-4 border-white shadow-xl flex items-center justify-center text-white font-display font-black text-2xl flex-shrink-0 group-hover/card:scale-105 transition-transform">
                          {getInitials(apt.doctor.user.name)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-display font-extrabold text-gray-dark text-xl sm:text-2xl">د. {apt.doctor.user.name}</h3>
                            <span className={`flex items-center gap-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${st.cls}`}>
                              <span className={`w-2 h-2 rounded-full ${st.dot} animate-pulse`} />
                              {st.text}
                            </span>
                          </div>
                          <p className="text-base font-bold text-emerald-600/70">{apt.doctor.specialization}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs font-black text-primary flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/50">
                              <Clock className="w-4 h-4" />
                              {formatTime(apt.dateTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {apt.status === "BOOKED" && (
                        <Link href="/patient/appointments" className="bg-white text-primary-dark font-display font-bold px-8 py-3 rounded-xl border border-emerald-100 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-center shadow-sm">
                          إدارة الموعد
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
