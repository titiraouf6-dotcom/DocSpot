"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { PaymentInfoCard } from "@/components/PaymentInfoCard";
import { FileUpload } from "@/components/FileUpload";
import {
  Crown, Check, Clock, ArrowLeft, ArrowRight, Upload,
  CalendarDays, Sparkles, Shield, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface DoctorSubscriptionData {
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
  hasPendingRenewal: boolean;
}

export default function DoctorSubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [prices, setPrices] = useState({ monthlyPrice: 2000, yearlyPrice: 20000 });
  const [subData, setSubData] = useState<DoctorSubscriptionData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const status = (session?.user as any)?.subscriptionStatus;
  const isRenewal = subData?.subscriptionStatus === "ACTIVE";
  const hasPendingRenewal = subData?.hasPendingRenewal || false;

  useEffect(() => {
    fetch("/api/settings/payment-info")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setPrices({
            monthlyPrice: data.monthlyPrice || 2000,
            yearlyPrice: data.yearlyPrice || 20000,
          });
        }
      })
      .catch(() => {});

    // Fetch current subscription data
    fetch("/api/doctor/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSubData({
            subscriptionStatus: data.subscriptionStatus,
            subscriptionPlan: data.subscriptionPlan,
            subscriptionExpiresAt: data.subscriptionExpiresAt,
            hasPendingRenewal: data.hasPendingRenewal || false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlan) {
      toast.error("الرجاء اختيار خطة اشتراك");
      return;
    }
    if (!paymentProofUrl) {
      toast.error("الرجاء رفع وصل الدفع");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/doctor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentProofUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "حدث خطأ");
        return;
      }
      setSubmitted(true);
      toast.success(data.message || "تم إرسال الطلب بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ar-DZ").format(amount) + " د.ج";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getRemainingDays = () => {
    if (!subData?.subscriptionExpiresAt) return null;
    const now = new Date();
    const expiry = new Date(subData.subscriptionExpiresAt);
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getNewExpiryPreview = () => {
    if (!selectedPlan || !subData?.subscriptionExpiresAt) return null;
    const currentExpiry = new Date(subData.subscriptionExpiresAt);
    const now = new Date();
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = selectedPlan === "YEARLY"
      ? new Date(baseDate.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate())
      : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate());
    const newRemaining = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { date: newExpiry, days: newRemaining };
  };

  // Already submitted or waiting for approval (first-time only)
  if ((status === "SUBSCRIPTION_WAITING_APPROVAL" && !isRenewal) || (submitted && !isRenewal)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 flex items-center justify-center px-4 py-12">
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-xl relative z-10">
          {/* Logo & Brand */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 animate-pulse" />
                <Logo size={72} animate />
              </div>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">DocSpot</h1>
            <p className="text-emerald-600/60 text-sm font-medium mt-1">منصتك الطبية الموثوقة</p>
          </div>

          <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-emerald-100/50">
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-l from-primary via-emerald-400 to-primary" />

            <div className="p-10 text-center">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-amber-100 rounded-[2rem] blur-xl scale-110 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2rem] flex items-center justify-center border-2 border-amber-100 shadow-xl shadow-amber-100/50">
                  <Clock className="w-12 h-12 text-amber-500" />
                </div>
              </div>

              <h2 className="text-2xl font-display font-black text-emerald-950 mb-3">
                في انتظار المراجعة
              </h2>
              <p className="text-emerald-800/60 leading-relaxed text-sm max-w-sm mx-auto mb-8 font-medium">
                تم إرسال طلب الاشتراك ووصل الدفع بنجاح. في انتظار مراجعة الإدارة لتفعيل حسابك.
                سيتم إعلامك داخل التطبيق عند القبول.
              </p>

              <div className="rounded-2xl p-4 mb-8 border bg-emerald-50 border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-right leading-relaxed text-emerald-700">
                    يرجى تسجيل الدخول لاحقاً للتحقق من حالة اشتراكك والبدء في استقبال مرضاك
                  </p>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full py-4 rounded-2xl border-2 border-emerald-100 text-emerald-700 font-display font-bold text-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <ArrowLeft className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renewal submitted successfully
  if (submitted && isRenewal) {
    return (
      <div className="space-y-10 max-w-3xl mx-auto pb-10 animate-fade-in-up">
        <div className="card bg-white text-center p-12 space-y-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-extrabold text-gray-dark">
              تم إرسال طلب التجديد بنجاح
            </h2>
            <p className="text-gray-medium leading-relaxed max-w-md mx-auto">
              طلب تجديد اشتراكك قيد المراجعة الآن. سيتم إضافة المدة إلى اشتراكك الحالي فور الموافقة.
              يمكنك الاستمرار في استخدام المنصة بشكل طبيعي.
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/settings")}
            className="btn-primary px-10 py-4 inline-flex items-center gap-3"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للإعدادات
          </button>
        </div>
      </div>
    );
  }

  // Has a pending renewal already
  if (hasPendingRenewal && isRenewal) {
    return (
      <div className="space-y-10 max-w-3xl mx-auto pb-10 animate-fade-in-up">
        <div className="card bg-white text-center p-12 space-y-8">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-display font-extrabold text-gray-dark">
              طلب تجديد قيد المراجعة
            </h2>
            <p className="text-gray-medium leading-relaxed max-w-md mx-auto">
              لديك بالفعل طلب تجديد اشتراك قيد المراجعة. يرجى الانتظار حتى تتم الموافقة عليه قبل إرسال طلب جديد.
            </p>
          </div>
          <button
            onClick={() => router.push("/doctor/settings")}
            className="btn-primary px-10 py-4 inline-flex items-center gap-3"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للإعدادات
          </button>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const remainingDays = getRemainingDays();
  const newExpiryPreview = getNewExpiryPreview();

  // Renewal mode for ACTIVE doctors (inside dashboard layout)
  if (isRenewal) {
    return (
      <div className="space-y-10 max-w-3xl mx-auto pb-10 animate-fade-in-up">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><RefreshCw className="w-8 h-8 text-primary" /></div>
              تجديد الاشتراك
            </h1>
            <p className="text-gray-medium text-sm font-medium">قم بتمديد اشتراكك الحالي للاستمرار في استقبال المرضى.</p>
          </div>
          <button
            onClick={() => router.push("/doctor/settings")}
            className="px-8 py-4 rounded-2xl border-2 border-emerald-100 text-gray-dark font-display font-bold text-sm hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
            العودة
          </button>
        </div>

        {/* Current Subscription Status */}
        <div className="card bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px] -ml-24 -mb-24" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Crown className="w-10 h-10 text-amber-400" />
            </div>
            <div className="flex-1 text-center md:text-right space-y-3">
              <h3 className="text-xl font-display font-black">اشتراكك الحالي</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-xs font-bold px-4 py-2 rounded-full">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  {subData?.subscriptionPlan === "YEARLY" ? "الخطة السنوية" : "الخطة الشهرية"}
                </span>
                {remainingDays !== null && (
                  <span className={`inline-flex items-center gap-2 backdrop-blur-md border text-xs font-bold px-4 py-2 rounded-full ${
                    remainingDays <= 7
                      ? "bg-red-500/20 border-red-400/30 text-red-200"
                      : "bg-white/10 border-white/20 text-emerald-100"
                  }`}>
                    <Shield className="w-4 h-4" />
                    {remainingDays} يوم متبقي
                  </span>
                )}
              </div>
              {subData?.subscriptionExpiresAt && (
                <p className="text-emerald-200/60 text-sm font-medium">
                  ينتهي في: {formatDate(subData.subscriptionExpiresAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="card bg-white space-y-8 border-2 border-emerald-50">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
            <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              اختر مدة التجديد
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <button
              type="button"
              onClick={() => setSelectedPlan("MONTHLY")}
              className={`group relative rounded-[2rem] p-8 text-right transition-all duration-300 border-2 overflow-hidden ${
                selectedPlan === "MONTHLY"
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-emerald-100 bg-white hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              {selectedPlan === "MONTHLY" && (
                <div className="absolute top-4 left-4 w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Crown className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-extrabold text-gray-dark">شهري</h3>
              </div>
              <p className="text-3xl font-display font-black text-primary mb-2">
                {formatCurrency(prices.monthlyPrice)}
              </p>
              <p className="text-sm text-gray-medium font-bold">+ 30 يوم إضافي</p>
            </button>

            {/* Yearly Plan */}
            <button
              type="button"
              onClick={() => setSelectedPlan("YEARLY")}
              className={`group relative rounded-[2rem] p-8 text-right transition-all duration-300 border-2 overflow-hidden ${
                selectedPlan === "YEARLY"
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-emerald-100 bg-white hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              {selectedPlan === "YEARLY" && (
                <div className="absolute top-4 left-4 w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                الأفضل قيمة
              </div>
              <div className="flex items-center gap-4 mb-6 mt-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Crown className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-display font-extrabold text-gray-dark">سنوي</h3>
              </div>
              <p className="text-3xl font-display font-black text-primary mb-2">
                {formatCurrency(prices.yearlyPrice)}
              </p>
              <p className="text-sm text-gray-medium font-bold">+ 365 يوم إضافي</p>
            </button>
          </div>

          {/* New Expiry Preview */}
          {selectedPlan && newExpiryPreview && (
            <div className="bg-emerald-50 rounded-[2rem] p-6 border-2 border-emerald-100 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-display font-extrabold text-gray-dark text-sm">معاينة بعد التجديد</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 text-center border border-emerald-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">تاريخ الانتهاء الجديد</p>
                  <p className="text-sm font-display font-black text-gray-dark">{formatDate(newExpiryPreview.date.toISOString())}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center border border-emerald-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">الأيام المتبقية</p>
                  <p className="text-lg font-display font-black text-primary">{newExpiryPreview.days} <span className="text-xs">يوم</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedPlan && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Payment Info */}
            <PaymentInfoCard />

            {/* Upload Payment Proof */}
            <div className="card bg-white border-2 border-emerald-50 space-y-6">
              <div className="flex items-center gap-3 border-b border-emerald-50 pb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-extrabold text-gray-dark">رفع وصل الدفع</h3>
              </div>
              <FileUpload
                endpoint="paymentProof"
                value={paymentProofUrl}
                onChange={setPaymentProofUrl}
                label="وصل الدفع (صورة أو PDF)"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !paymentProofUrl}
              className="w-full group relative bg-primary text-white font-display font-black px-10 py-6 rounded-3xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </div>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
                  <span>تأكيد طلب التجديد</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // First-time subscription (outside dashboard)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 py-12 px-4 relative">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10 space-y-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 animate-pulse" />
              <Logo size={72} animate />
            </div>
          </div>
          <h1 className="text-4xl font-display font-black text-emerald-950 mb-4 tracking-tight">
            اختر خطة الاشتراك
          </h1>
          <p className="text-emerald-800/60 font-medium max-w-md mx-auto">
            اختر الخطة المناسبة لك للبدء في استخدام منصة DocSpot واستقبال مرضاك بكل احترافية
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan("MONTHLY")}
            className={`group relative rounded-[2.5rem] p-8 text-right transition-all duration-300 border-2 overflow-hidden bg-white/80 backdrop-blur-xl ${
              selectedPlan === "MONTHLY"
                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]"
                : "border-emerald-100 hover:border-primary/40 hover:shadow-xl hover:shadow-emerald-900/5"
            }`}
          >
            {selectedPlan === "MONTHLY" && (
              <div className="absolute top-6 left-6 w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                selectedPlan === "MONTHLY" ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-600 group-hover:bg-primary/5"
              }`}>
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950">الخطة الشهرية</h3>
                <p className="text-sm text-emerald-600/70 font-medium">دفع شهري مرن</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-display font-black text-primary">
                {formatCurrency(prices.monthlyPrice)}
              </p>
              <p className="text-sm font-bold text-emerald-800/60">يجدد كل 30 يوم</p>
            </div>
          </button>

          {/* Yearly Plan */}
          <button
            type="button"
            onClick={() => setSelectedPlan("YEARLY")}
            className={`group relative rounded-[2.5rem] p-8 text-right transition-all duration-300 border-2 overflow-hidden bg-white/80 backdrop-blur-xl ${
              selectedPlan === "YEARLY"
                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 scale-[1.02]"
                : "border-emerald-100 hover:border-primary/40 hover:shadow-xl hover:shadow-emerald-900/5"
            }`}
          >
            {selectedPlan === "YEARLY" && (
              <div className="absolute top-6 left-6 w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
              الأفضل قيمة
            </div>
            <div className="flex items-center gap-5 mb-8 mt-2">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                selectedPlan === "YEARLY" ? "bg-amber-100 text-amber-600" : "bg-amber-50 text-amber-500 group-hover:bg-amber-100/50"
              }`}>
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950">الخطة السنوية</h3>
                <p className="text-sm text-emerald-600/70 font-medium">توفير وحماية من التضخم</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-display font-black text-primary">
                {formatCurrency(prices.yearlyPrice)}
              </p>
              <p className="text-sm font-bold text-emerald-800/60">يجدد كل 365 يوم</p>
            </div>
          </button>
        </div>

        {selectedPlan && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700 pb-12">
            {/* Payment Info Card */}
            <PaymentInfoCard />

            {/* Upload Payment Proof */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-emerald-100/50 p-8">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-emerald-50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-extrabold text-emerald-950">رفع وصل الدفع</h3>
                  <p className="text-sm font-medium text-emerald-600/60 mt-1">الرجاء إرفاق صورة أو ملف PDF واضح لوصل الدفع</p>
                </div>
              </div>
              <FileUpload
                endpoint="paymentProof"
                value={paymentProofUrl}
                onChange={setPaymentProofUrl}
                label="وصل الدفع"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !paymentProofUrl}
              className="w-full group relative bg-gradient-to-r from-primary to-emerald-400 text-white font-display font-black text-lg px-10 py-6 rounded-[2rem] shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الإرسال...</span>
                </div>
              ) : (
                <>
                  <span>إرسال طلب الاشتراك</span>
                  <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2 duration-300" />
                </>
              )}
            </button>
          </div>
        )}

        {!selectedPlan && (
          <div className="text-center pt-8 pb-12">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-emerald-600/50 hover:text-emerald-800 font-bold text-sm transition-all duration-200"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
