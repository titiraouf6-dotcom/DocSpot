"use client";

import { useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";
import {
  Clock, CheckCircle, Bell, FileText, Shield,
  ArrowLeft, Stethoscope, Sparkles
} from "lucide-react";
import { signOut } from "next-auth/react";

export default function DoctorPendingPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || "الطبيب";
  const status = (session?.user as any)?.subscriptionStatus;
  const isRejected = status === "REJECTED";

  const steps = [
    { icon: CheckCircle, label: "تم استلام طلب التسجيل", done: true },
    { icon: FileText, label: "تم رفع وثيقة الإثبات", done: true },
    { icon: Clock, label: "في انتظار مراجعة الإدارة", done: false, active: !isRejected },
    { icon: Bell, label: "سيتم إعلامك عند القبول", done: false, active: false },
  ];

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

        {/* Main Card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-emerald-100/50">
          {/* Gradient top bar */}
          <div className="h-1.5 bg-gradient-to-l from-primary via-emerald-400 to-primary" />

          <div className="p-10 text-center">
            {/* Status Icon */}
            {isRejected ? (
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-red-100 rounded-[2rem] blur-xl scale-110" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-[2rem] flex items-center justify-center border-2 border-red-100 shadow-xl shadow-red-100/50">
                  <Shield className="w-12 h-12 text-red-500" />
                </div>
              </div>
            ) : (
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-amber-100 rounded-[2rem] blur-xl scale-110 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2rem] flex items-center justify-center border-2 border-amber-100 shadow-xl shadow-amber-100/50">
                  <Clock className="w-12 h-12 text-amber-500" />
                </div>
              </div>
            )}

            {/* Title & Description */}
            <h2 className="text-2xl font-display font-black text-emerald-950 mb-3">
              {isRejected ? "تم رفض طلبك" : "حسابك قيد المراجعة"}
            </h2>
            <p className="text-emerald-800/60 leading-relaxed text-sm max-w-sm mx-auto mb-8 font-medium">
              {isRejected
                ? "نأسف، تم رفض وثيقة الإثبات الخاصة بك. يرجى التواصل مع الإدارة لمعرفة التفاصيل أو إعادة تقديم وثيقة صحيحة."
                : "تم إنشاء حسابك بنجاح. نقوم الآن بمراجعة وثائقك للتحقق من هويتك المهنية. ستتلقى إشعاراً فور اكتمال المراجعة."
              }
            </p>

            {/* Steps Timeline */}
            <div className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100/50 mb-8">
              <div className="space-y-0">
                {steps.map((step, i) => {
                  const isLast = i === steps.length - 1;
                  const isDone = step.done;
                  const isActive = step.active;
                  const isRejectedStep = isRejected && i === 2;

                  return (
                    <div key={i} className="relative">
                      <div className="flex items-center gap-4 py-3">
                        {/* Icon */}
                        <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isRejectedStep
                            ? "bg-red-100 text-red-500"
                            : isDone
                              ? "bg-primary/10 text-primary"
                              : isActive
                                ? "bg-amber-100 text-amber-500"
                                : "bg-gray-100 text-gray-300"
                        }`}>
                          {isRejectedStep ? (
                            <Shield className="w-5 h-5" />
                          ) : (
                            <step.icon className={`w-5 h-5 ${isActive && !isDone ? "animate-pulse" : ""}`} />
                          )}
                        </div>

                        {/* Label */}
                        <span className={`text-sm font-bold text-right flex-1 ${
                          isRejectedStep
                            ? "text-red-600"
                            : isDone
                              ? "text-emerald-800"
                              : isActive
                                ? "text-amber-700"
                                : "text-gray-400"
                        }`}>
                          {isRejectedStep ? "تم رفض الوثيقة" : step.label}
                        </span>

                        {/* Status dot */}
                        {isDone && (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Connector line */}
                      {!isLast && (
                        <div className={`absolute right-[19px] top-[52px] w-0.5 h-3 rounded-full ${
                          isDone ? "bg-primary/20" : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Banner */}
            <div className={`rounded-2xl p-4 mb-8 border ${
              isRejected
                ? "bg-red-50 border-red-100"
                : "bg-emerald-50 border-emerald-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isRejected ? "bg-red-100" : "bg-emerald-100"
                }`}>
                  {isRejected ? (
                    <Shield className="w-5 h-5 text-red-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className={`text-xs font-bold text-right leading-relaxed ${
                  isRejected ? "text-red-700" : "text-emerald-700"
                }`}>
                  {isRejected
                    ? "يرجى التواصل مع الدعم الفني أو إعادة التسجيل بوثيقة صحيحة"
                    : "يرجى تسجيل الدخول لاحقاً للتحقق من حالة حسابك والبدء في استقبال مرضاك"
                  }
                </p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-4 rounded-2xl border-2 border-emerald-100 text-emerald-700 font-display font-bold text-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-600/40">
            <Stethoscope className="w-4 h-4" />
            <p className="text-xs font-bold">
              مرحباً د. {name}
            </p>
          </div>
          <p className="text-[10px] text-emerald-600/30 font-bold uppercase tracking-widest">
            DocSpot © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
