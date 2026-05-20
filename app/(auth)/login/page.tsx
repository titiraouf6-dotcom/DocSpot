"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("الرجاء إدخال البريد الإلكتروني وكلمة المرور"); return; }
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        toast.success("تم تسجيل الدخول بنجاح");
        const session = await fetch("/api/auth/session").then((r) => r.json());
        const role = session?.user?.role;
        if (role === "PATIENT") router.push("/patient");
        else if (role === "DOCTOR") router.push("/doctor");
        else if (role === "ADMIN") router.push("/admin");
        else router.push(callbackUrl);
      }
    } catch { toast.error("حدث خطأ أثناء تسجيل الدخول"); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 md:p-10 shadow-2xl shadow-emerald-900/10 space-y-6 relative z-10 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-extrabold text-emerald-950 mb-2">تسجيل الدخول</h1>
        <p className="text-emerald-900/60 font-medium text-sm">أدخل بياناتك للوصول إلى حسابك في DocSpot</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-emerald-950 mb-2">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="example@email.com" autoComplete="email" dir="ltr" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-emerald-950 mb-2">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/40" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 pr-12 pl-12 text-emerald-950 font-medium placeholder:text-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="••••••••" autoComplete="current-password" dir="ltr" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40 hover:text-emerald-900 transition-colors">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-primary-dark transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 mt-8">
        {loading ? <span className="animate-pulse">جاري التحقق...</span> : <><span>تسجيل الدخول</span><ArrowLeft className="w-5 h-5" /></>}
      </button>

      <p className="text-center mt-6 text-sm font-medium text-emerald-900/60">
        ليس لديك حساب؟ <Link href="/register" className="text-primary font-bold hover:text-primary-dark hover:underline transition-colors">إنشاء حساب جديد</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F0FDF4] relative overflow-hidden flex flex-col">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-300/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 bg-transparent py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={34} />
            <span className="text-xl font-display font-extrabold text-emerald-950 tracking-tight">DocSpot</span>
          </Link>
          <Link href="/register" className="text-sm font-bold text-primary bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 hover:bg-white hover:border-emerald-200 transition-all shadow-sm">
            حساب جديد
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-emerald-900/5 border border-white/50">
              <Logo size={48} animate />
            </div>
          </div>
          
          <Suspense fallback={<div className="bg-white/80 rounded-[2.5rem] border border-white shadow-xl p-8 h-[400px] animate-pulse" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
