"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import {
  Stethoscope, User, Search, Shield, Smartphone,
  ArrowLeft, Download, Bell, ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [supportEmail, setSupportEmail] = useState("contact@docspot.dz");
  const [supportPhone, setSupportPhone] = useState("+213 550 00 00 00");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });

    fetch(`/api/public/settings?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { 
        if (d?.supportEmail) setSupportEmail(d.supportEmail); 
        if (d?.supportPhone) setSupportPhone(d.supportPhone);
      })
      .catch(() => { });

    if (typeof window !== "undefined") {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iosStandalone = ("standalone" in window.navigator) && (window.navigator as any).standalone;
      if (standalone || iosStandalone) setIsInstalled(true);
    }

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      toast.info(isIos
        ? "لتحميل التطبيق: اضغط على زر المشاركة ثم 'إضافة للشاشة الرئيسية'"
        : "لتحميل التطبيق: افتح القائمة واختر 'إضافة للشاشة الرئيسية'"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] overflow-x-hidden" dir="rtl">

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm py-3" : "bg-transparent py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Logo size={34} />
            <span className="text-xl font-display font-extrabold text-emerald-950 tracking-tight">DocSpot</span>
          </div>
          {/* Center link */}
          <div className="hidden sm:flex">
            <Link href="/" className="text-sm font-bold text-emerald-900/70 px-4 py-2 rounded-xl hover:bg-emerald-50 hover:text-primary transition-all">
              الرئيسية
            </Link>
          </div>
          {/* Auth buttons */}
          <div className="flex gap-3">
            <Link href="/login"
              className="text-sm font-bold text-emerald-900 bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 hover:bg-white hover:border-emerald-200 hover:text-primary transition-all shadow-sm">
              دخول
            </Link>
            <Link href="/register"
              className="text-sm font-bold text-white bg-primary px-5 py-2.5 rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0">
              حساب جديد
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative w-full min-h-[100dvh] flex items-center pt-24 pb-20 overflow-hidden">
        {/* Decorative background blur blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-300/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">

          {/* Text */}
          <div className="order-1 lg:order-1 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 text-primary-dark bg-emerald-100/50 backdrop-blur-sm border border-emerald-200/50 text-sm font-bold px-4 py-2 rounded-full mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              المنصة الصحية الذكية في الجزائر
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-emerald-950 leading-[1.15] mb-6 tracking-tight">
              أفضل الأطباء،<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-emerald-400">
                بين يديك
              </span>
            </h1>
            <p className="text-emerald-900/60 leading-relaxed mb-10 text-lg max-w-xl font-medium">
              ابحث عن أفضل الأطباء في منطقتك واحجز موعدك في ثوانٍ. اقرأ مراجعات المرضى وقم بإدارة ملفك الطبي بكل أمان وخصوصية.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=PATIENT"
                className="flex items-center justify-center gap-3 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary-dark transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 text-base">
                <User className="w-5 h-5" /> ابدأ كـ مريض
              </Link>
              <Link href="/register?role=DOCTOR"
                className="flex items-center justify-center gap-3 bg-white/60 backdrop-blur-md border-2 border-white text-emerald-900 font-bold px-8 py-4 rounded-2xl hover:bg-white hover:border-emerald-100 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-base">
                <Stethoscope className="w-5 h-5" /> انضم كـ طبيب
              </Link>
            </div>
            {/* Trust */}
            <div className="mt-10 flex items-center gap-4 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4 w-fit shadow-sm">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {["bg-emerald-300", "bg-emerald-400", "bg-primary"].map((c, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full ${c} border-2 border-[#F0FDF4] flex items-center justify-center shadow-sm`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-emerald-900/70">
                يثق بنا <span className="font-extrabold text-emerald-950">+10,000</span> مستخدم
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="order-2 lg:order-2 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-100 border-8 border-white shadow-2xl shadow-emerald-900/10">
              <Image
                src="/images/hero-medical.png"
                alt="DocSpot"
                width={800}
                height={600}
                className="w-full h-[500px] lg:h-[600px] object-cover scale-105 hover:scale-100 transition-transform duration-700"
                priority
              />
              {/* Floating card */}
              <div className="absolute bottom-6 left-6 right-6 glass bg-white/90 rounded-3xl p-5 shadow-xl border border-white/50 animate-float">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-emerald-950">موعد مؤكد بنجاح</p>
                    <p className="text-sm font-medium text-emerald-900/60">د. أحمد بن علي – عيادة القلب</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                  <p className="text-sm font-bold text-emerald-900/70 flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    غداً، 10:00 صباحاً
                  </p>
                  <span className="text-xs font-bold text-primary bg-emerald-100 px-3 py-1.5 rounded-lg shadow-sm">
                    حالة الحضور: مضمون
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Why DocSpot ── */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-24 bg-white rounded-[3rem] shadow-sm z-20 -mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-emerald-950 mb-4 tracking-tight">
              لماذا تختار <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-emerald-400">DocSpot</span>؟
            </h2>
            <p className="text-emerald-900/60 max-w-xl mx-auto text-base font-medium leading-relaxed">
              نحن نقدم أسهل وأسرع طريقة للوصول إلى الخدمة الطبية في الجزائر عبر منصة حديثة وموثوقة.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Feature 1 — Image card */}
            <div className="relative rounded-[2.5rem] overflow-hidden group shadow-lg shadow-emerald-900/5 border border-gray-100">
              <Image
                src="/images/feature-search.png"
                alt="بحث ذكي"
                width={720}
                height={400}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Feature 1 — Text card */}
            <div className="bg-[#F0FDF4]/50 border border-emerald-100 rounded-[2.5rem] p-10 flex flex-col justify-center hover:bg-emerald-50 transition-colors duration-300">
              <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-extrabold text-emerald-950 mb-4">بحث ذكي ودقيق</h3>
              <p className="text-emerald-900/60 leading-relaxed text-base font-medium">
                استخدم محرك البحث المتقدم للعثور على الأطباء القريبين إليك حسب التخصص، مع مراجعات حقيقية وتقييمات موثوقة من مرضى سابقين.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Feature 2 — Dark green card */}
            <div className="rounded-[2.5rem] overflow-hidden relative group shadow-xl shadow-emerald-900/10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-950 z-0" />
              <Image
                src="/images/feature-notifications.png"
                alt="تنبيهات"
                width={720}
                height={400}
                className="w-full h-80 object-cover opacity-30 mix-blend-overlay group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 relative z-10"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-10 z-20">
                <div className="w-14 h-14 glass-light rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-sm">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-white mb-4">تنبيهات المواعيد الفورية</h3>
                <p className="text-emerald-100/80 leading-relaxed text-base font-medium">
                  لا تنسى مواعيدك أبداً. نرسل لك تذكيرات فورية عبر الإشعارات لضمان تواجدك في الوقت المحدد.
                </p>
              </div>
            </div>

            {/* Feature 2 — Privacy card */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-lg shadow-emerald-900/5 hover:border-emerald-100 transition-colors duration-300">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-display font-extrabold text-emerald-950 mb-4">خصوصية بياناتك أولويتنا</h3>
              <p className="text-emerald-900/60 leading-relaxed text-base font-medium">
                بياناتك الطبية محمية بأعلى المعايير. نضمن خصوصيتك الكاملة وتشفير جميع معلوماتك الصحية وملفاتك.
              </p>
            </div>
          </div>

          {/* Feature 3 — Full width image */}
          <div className="relative rounded-[2.5rem] overflow-hidden group shadow-xl shadow-emerald-900/10">
            <Image
              src="/images/feature-records.png"
              alt="الملف الطبي الرقمي"
              width={1400}
              height={440}
              className="w-full h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-emerald-950/90 via-emerald-950/60 to-transparent">
              <div className="h-full flex flex-col justify-center items-end p-10 md:p-16 max-w-7xl mx-auto">
                <div className="max-w-md text-right">
                  <div className="w-14 h-14 glass-light rounded-2xl flex items-center justify-center mb-6 mr-auto ml-0 border border-white/20">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-display font-extrabold text-white mb-4">الملف الطبي الرقمي</h3>
                  <p className="text-emerald-100/90 leading-relaxed mb-8 text-base font-medium">
                    احتفظ بكل سجلاتك الطبية، الوصفات، والتحاليل في مكان واحد آمن وبسهولة الوصول من أي جهاز.
                  </p>
                  <button className="flex items-center gap-2 text-primary bg-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm">
                    اكتشف الميزة <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-24 pb-32">
        <div className="max-w-6xl mx-auto rounded-[3rem] px-8 sm:px-16 py-20 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-800" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-900/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white mb-6 tracking-tight">
              هل أنت مستعد لبدء رحلتك الصحية؟
            </h2>
            <p className="text-emerald-50 mb-10 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              انضم إلى آلاف المستخدمين الذين يثقون في DocSpot لتسهيل مواعيدهم وإدارة ملفاتهم الطبية يومياً.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-950 font-extrabold px-8 py-4 rounded-2xl hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl text-base">
                سجل حسابك مجاناً <ArrowLeft className="w-5 h-5" />
              </Link>
              <a href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center gap-2 bg-emerald-800/40 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-emerald-800/60 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-base">
                تواصل مع الدعم
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full py-16 bg-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6 opacity-90">
                <Logo size={34} />
                <span className="text-white font-display font-extrabold text-xl tracking-tight">DocSpot</span>
              </div>
              <p className="text-emerald-100/60 text-sm leading-relaxed font-medium">
                المنصة الأولى والأكثر أماناً لحجز المواعيد وإدارة الملفات الطبية في الجزائر.
              </p>
            </div>
            {/* Links */}
            {[
              { title: "عن المنصة", links: ["من نحن", "سياسة الخصوصية", "شروط الاستخدام"] },
              { title: "المساعدة", links: ["كيف يعمل؟", "الأسئلة الشائعة", "الدعم الفني"] },
              { title: "تواصل معنا", links: [supportEmail, supportPhone] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-bold text-base mb-6 tracking-wide">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(l => (
                    <li key={l} dir={col.title === "تواصل معنا" ? "ltr" : "rtl"} className={`text-emerald-100/60 text-sm font-medium hover:text-white transition-all cursor-pointer block w-fit ${col.title === "تواصل معنا" ? "hover:translate-x-2" : "hover:-translate-x-2"}`}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <div className="text-sm text-emerald-100/40 font-medium">
              © {new Date().getFullYear()} DocSpot — جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile install btn */}
      {!isInstalled && (
        <div className="fixed bottom-6 inset-x-4 z-40 md:hidden flex justify-center pointer-events-none animate-fade-in-up">
          <button onClick={handleInstall}
            className="pointer-events-auto w-full max-w-sm bg-emerald-900/90 backdrop-blur-xl text-white font-extrabold py-4 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border border-white/10 hover:bg-emerald-950 transition-colors">
            <Download className="w-5 h-5 animate-bounce" /> 
            <span>تثبيت التطبيق مجاناً</span>
          </button>
        </div>
      )}
    </div>
  );
}
