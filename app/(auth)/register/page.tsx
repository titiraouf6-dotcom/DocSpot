"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { WilayaCommuneSelect } from "@/components/WilayaCommuneSelect";
import { FileUpload } from "@/components/FileUpload";
import { specializations } from "@/lib/constants/specializations";
import {
  Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone,
  Stethoscope, Link as LinkIcon, Shield, CheckCircle, Settings, CreditCard
} from "lucide-react";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">(
    (searchParams.get("role") as "PATIENT" | "DOCTOR") || "PATIENT"
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    specialization: "", certificateUrl: "", about: "",
    wilaya: "", commune: "", googleMapsLink: "", insuranceAmount: 1000,
    ccpAccount: "",
    ccpCle: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة"); return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين"); return;
    }
    if (form.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return;
    }
    if (role === "DOCTOR" && (!form.specialization || !form.certificateUrl || !form.wilaya || !form.commune || !form.googleMapsLink)) {
      toast.error("الرجاء ملء جميع حقول الطبيب المطلوبة"); return;
    }
    if (role === "DOCTOR" && form.ccpAccount && form.ccpAccount.length !== 12) {
      toast.error("رقم حساب CCP يجب أن يكون 12 رقماً بالضبط"); return;
    }
    if (role === "DOCTOR" && form.ccpCle && form.ccpCle.length !== 2) {
      toast.error("Clé يجب أن يكون رقمين بالضبط"); return;
    }

    setLoading(true);
    try {
      const ccpNumber = form.ccpAccount && form.ccpCle
        ? `${form.ccpAccount} Clé ${form.ccpCle}`
        : form.ccpAccount || null;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ccpNumber, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "حدث خطأ"); return; }

      if (role === "DOCTOR") {
        setShowSuccess(true);
        setSuccessMessage(data.message);
      } else {
        toast.success("تم إنشاء الحساب بنجاح");
        await signIn("credentials", { email: form.email, password: form.password, redirect: false });
        router.push("/patient");
      }
    } catch { toast.error("حدث خطأ"); } finally { setLoading(false); }
  };

  const updateField = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));

  if (showSuccess) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 md:p-12 shadow-2xl shadow-emerald-900/10 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-emerald-950 mb-4 tracking-tight">تم إنشاء حسابك بنجاح!</h2>
        <p className="text-emerald-900/60 font-medium leading-relaxed mb-8 max-w-sm mx-auto">
          {successMessage || "حسابك قيد المراجعة من قبل الجهات المعنية. سيتم إعلامك داخل التطبيق عند قبولك."}
        </p>
        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 mb-8 inline-block">
          <p className="text-amber-800 text-sm font-bold flex items-center gap-2 justify-center">
            <Shield className="w-5 h-5 flex-shrink-0" />
            حسابك قيد المراجعة - يرجى الانتظار
          </p>
        </div>
        <Link href="/login" className="w-full bg-primary text-white font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
          تسجيل الدخول <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-6 md:p-10 shadow-2xl shadow-emerald-900/10 relative z-10 animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-extrabold text-emerald-950 mb-3 tracking-tight">إنشاء حساب جديد</h1>
        <p className="text-emerald-900/60 font-medium text-sm">انضم إلى منصة DocSpot، وجهتك الطبية الأولى</p>

        {/* Role Tabs */}
        <div className="flex gap-3 mt-8 justify-center bg-emerald-50/50 p-1.5 rounded-2xl border border-emerald-100/50 inline-flex mx-auto">
          <button
            type="button"
            onClick={() => setRole("DOCTOR")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              role === "DOCTOR" ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-emerald-900/60 hover:text-emerald-950 hover:bg-white/50"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            حساب طبيب
          </button>
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              role === "PATIENT" ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-emerald-900/60 hover:text-emerald-950 hover:bg-white/50"
            }`}
          >
            <User className="w-4 h-4" />
            حساب مريض
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-emerald-950 mb-2">الاسم الكامل *</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="أدخل اسمك الكامل" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-950 mb-2">البريد الإلكتروني *</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="example@docspot.dz" dir="ltr" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-emerald-950 mb-2">كلمة المرور *</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 pl-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="••••••••" dir="ltr" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40 hover:text-emerald-900 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-950 mb-2">تأكيد كلمة المرور *</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
              <input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="••••••••" dir="ltr" />
            </div>
          </div>
        </div>

        {role === "DOCTOR" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="border-t border-emerald-100/50 pt-8 mt-2">
              <h3 className="text-lg font-display font-bold text-emerald-950 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                المعلومات المهنية والعيادة
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-emerald-950 mb-2">التخصص *</label>
                <select value={form.specialization} onChange={(e) => updateField("specialization", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 text-emerald-950 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm">
                  <option value="" disabled>اختر التخصص</option>
                  {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-emerald-950 mb-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
                  <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="05 XX XX XX" dir="ltr" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <WilayaCommuneSelect
                wilayaValue={form.wilaya} communeValue={form.commune}
                onWilayaChange={(v) => updateField("wilaya", v)} onCommuneChange={(v) => updateField("commune", v)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-950 mb-2">موقع العيادة (Google Maps URL)</label>
              <div className="relative">
                <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
                <input type="url" value={form.googleMapsLink} onChange={(e) => updateField("googleMapsLink", e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="https://goo.gl/maps/..." dir="ltr" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-950 mb-2">مبلغ التأمين (د.ج) *</label>
              <div className="relative">
                <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
                <input type="number" value={form.insuranceAmount} onChange={(e) => updateField("insuranceAmount", parseFloat(e.target.value))} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" min={0} dir="ltr" />
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <FileUpload endpoint="certificate" value={form.certificateUrl} onChange={(url) => updateField("certificateUrl", url)} label="وثيقة الهوية المهنية (Professional ID) *" />
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-emerald-800 text-sm font-medium flex items-start gap-3 leading-relaxed">
                <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                بعد التسجيل، سيتم مراجعة حسابك من قبل فريق الإدارة. هذه العملية قد تستغرق من 24 إلى 48 ساعة.
              </p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-emerald-800 text-sm font-medium flex items-start gap-3 leading-relaxed">
                <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                مبلغ التأمين هو مبلغ يتم تجميده من محفظة المريض عند حجز موعد كضمان حضور، ويُسترجع بالكامل عند الحضور.
              </p>
            </div>

            {/* CCP Section */}
            <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <label className="flex items-center gap-2 text-base font-bold text-emerald-950 mb-5">
                <CreditCard className="w-5 h-5 text-primary" />
                حساب CCP (للسحب)
              </label>

              <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                {/* Account Number — 12 digits */}
                <div>
                  <p className="text-xs font-bold text-emerald-900/60 mb-2">رقم الحساب — 12 رقم</p>
                  <div className="relative">
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/40" />
                    <input
                      id="ccp-account"
                      type="text"
                      inputMode="numeric"
                      value={form.ccpAccount}
                      maxLength={12}
                      onInput={(e) => {
                        const val = (e.target as HTMLInputElement).value.replace(/\D/g, "");
                        updateField("ccpAccount", val);
                      }}
                      onChange={(e) => updateField("ccpAccount", e.target.value.replace(/\D/g, ""))}
                      className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pr-10 font-mono tracking-widest transition-all focus:bg-white focus:outline-none ${
                        form.ccpAccount.length > 0 && form.ccpAccount.length !== 12
                          ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                          : form.ccpAccount.length === 12
                          ? "border-emerald-400 focus:ring-2 focus:ring-emerald-200 bg-emerald-50/30"
                          : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                      placeholder="000000000000"
                      dir="ltr"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      form.ccpAccount.length === 12 ? "text-primary" :
                      form.ccpAccount.length > 0 ? "text-rose-500" : "text-emerald-900/40"
                    }`}>
                      {form.ccpAccount.length}/12 رقم
                    </span>
                  </div>
                </div>

                {/* Clé — 2 digits */}
                <div className="w-32">
                  <p className="text-xs font-bold text-emerald-900/60 mb-2">الـ Clé — 2 رقم</p>
                  <input
                    id="ccp-cle"
                    type="text"
                    inputMode="numeric"
                    value={form.ccpCle}
                    maxLength={2}
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value.replace(/\D/g, "");
                      updateField("ccpCle", val);
                    }}
                    onChange={(e) => updateField("ccpCle", e.target.value.replace(/\D/g, ""))}
                    className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 text-center font-mono tracking-widest text-lg transition-all focus:bg-white focus:outline-none ${
                      form.ccpCle.length > 0 && form.ccpCle.length !== 2
                        ? "border-rose-300 focus:ring-2 focus:ring-rose-200"
                        : form.ccpCle.length === 2
                        ? "border-emerald-400 focus:ring-2 focus:ring-emerald-200 bg-emerald-50/30"
                        : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                    placeholder="00"
                    dir="ltr"
                  />
                  <div className="mt-2 text-center">
                    <span className={`text-xs font-bold ${
                      form.ccpCle.length === 2 ? "text-primary" :
                      form.ccpCle.length > 0 ? "text-rose-500" : "text-emerald-900/40"
                    }`}>
                      {form.ccpCle.length}/2
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {(form.ccpAccount || form.ccpCle) && (
                <div className="mt-4 bg-gray-50/80 rounded-xl px-5 py-3 flex items-center justify-between border border-gray-100">
                  <span className="text-xs font-bold text-emerald-900/50">المعاينة النهائية:</span>
                  <span className="text-sm font-extrabold text-emerald-950 font-mono tracking-wider" dir="ltr">
                    {form.ccpAccount || "??????????????"}
                    {form.ccpCle ? ` Clé ${form.ccpCle}` : " Clé ??"}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 bg-rose-50/80 border border-rose-100 rounded-xl p-3">
                <Shield className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-rose-800 text-xs font-medium leading-relaxed">
                  <strong>تنبيه هامة:</strong> رقم CCP لا يمكن تغييره بعد التسجيل. تأكد من صحته تماماً.
                </p>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold rounded-2xl px-4 py-4.5 flex items-center justify-center gap-2 hover:bg-primary-dark transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 text-base mt-8">
          {loading ? <span className="animate-pulse">جاري إنشاء الحساب...</span> : <>إنشاء الحساب <ArrowLeft className="w-5 h-5" /></>}
        </button>
      </form>

      <p className="text-center mt-8 text-sm font-medium text-emerald-900/60">
        لديك حساب بالفعل؟ <Link href="/login" className="text-primary font-bold hover:text-primary-dark hover:underline transition-colors">تسجيل الدخول</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F0FDF4] relative overflow-x-hidden flex flex-col">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none fixed" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-300/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none fixed" />

      {/* Navbar */}
      <nav className="relative z-20 bg-transparent py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={34} />
            <span className="text-xl font-display font-extrabold text-emerald-950 tracking-tight">DocSpot</span>
          </Link>
          <Link href="/login" className="text-sm font-bold text-emerald-900 bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 hover:bg-white hover:border-emerald-200 transition-all shadow-sm">
            تسجيل الدخول
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10 w-full">
        <div className="w-full max-w-2xl">
          <Suspense fallback={<div className="bg-white/80 rounded-[2.5rem] border border-white shadow-xl p-8 h-[600px] animate-pulse" />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
