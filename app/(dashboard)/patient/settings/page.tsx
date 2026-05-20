"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User, Mail, Phone, Lock, Save, Pen, X, Check, Calendar, Shield, Info
} from "lucide-react";
import { toast } from "sonner";

interface PatientSettings {
  name: string;
  email: string;
  phone: string;
}

export default function PatientSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [data, setData] = useState<PatientSettings>({
    name: "", email: "", phone: "",
  });
  const [form, setForm] = useState<PatientSettings & { password: string }>({
    ...data, password: "",
  });

  useEffect(() => {
    fetch("/api/patient/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res && !res.error) {
          setData(res);
          setForm({ ...res, password: "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/patient/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          password: form.password,
        }),
      });
      if (res.ok) {
        toast.success("تم حفظ التغييرات بنجاح");
        setData({ name: form.name, email: data.email, phone: form.phone });
        setEditMode(false);
      } else toast.error("فشل في الحفظ");
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...data, password: "" });
    setEditMode(false);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w.charAt(0)).slice(0, 2).join("");

  const memberSince = session?.user ? new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long" }) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="space-y-10 pb-10 animate-fade-in-up max-w-5xl mx-auto">
      {/* ─── Page Title & Action ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-primary shadow-sm border border-emerald-100">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-emerald-950 tracking-tight">إعدادات الحساب</h1>
            <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mt-1">إدارة معلوماتك الشخصية والأمان</p>
          </div>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="group flex items-center gap-3 bg-white hover:bg-emerald-50 px-8 py-4 rounded-2xl border-2 border-emerald-50 text-emerald-950 font-display font-black text-sm transition-all duration-300 shadow-xl shadow-emerald-900/5 hover:scale-105 active:scale-95"
          >
            <Pen className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
            تعديل الملف الشخصي
          </button>
        )}
      </div>

      {/* ─── Profile Header Card ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Avatar Container */}
          <div className="relative">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-white/30 to-white/5 border-8 border-white/10 backdrop-blur-xl flex items-center justify-center text-white text-5xl font-display font-black shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {getInitials(data.name)}
              <div className="absolute -bottom-2 -left-2 bg-primary border-4 border-emerald-900 rounded-full p-3 shadow-xl">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center md:text-right space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight leading-none">{data.name}</h2>
              <span className="inline-flex items-center gap-2 bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-lg self-center">
                <Shield className="w-3.5 h-3.5" />
                حساب مريض موثق
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/60">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                <Mail className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-bold tracking-wide" dir="ltr">{data.email}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-bold">انضم في {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Area ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-10">
        {!editMode ? (
          /* View Mode */
          <div className="card bg-white/80 backdrop-blur-2xl border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 stagger-children">
            <div className="flex items-center gap-4 mb-10 border-b border-emerald-50 pb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">تفاصيل الهوية</h3>
                <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mt-1">البيانات الأساسية المسجلة في النظام</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoRow icon={<User className="w-5 h-5" />} label="الاسم المعروض" value={data.name} />
              <InfoRow icon={<Mail className="w-5 h-5" />} label="البريد الإلكتروني الأساسي" value={data.email} dir="ltr" />
              <InfoRow icon={<Phone className="w-5 h-5" />} label="رقم الهاتف للتواصل" value={data.phone || "لم يتم التحديد"} dir="ltr" />
              <InfoRow icon={<Lock className="w-5 h-5" />} label="أمن الحساب" value="تغيير كلمة المرور متاح" subValue="••••••••" />
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="animate-fade-in space-y-10 stagger-children">
            {/* Frozen Fields Section */}
            <div className="card bg-emerald-50/30 border-2 border-emerald-100/50 border-dashed rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-[40px] -mr-16 -mt-16" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-emerald-900 tracking-tight">بيانات النظام الثابتة</h3>
                    <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-widest">هذه المعلومات مرتبطة بهويتك الرقمية ولا يمكن تعديلها حالياً</p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                  <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2">عنوان البريد الإلكتروني</label>
                  <div className="bg-white/50 border-2 border-emerald-100/50 rounded-2xl py-4 px-6 text-emerald-950 font-bold flex items-center gap-4 cursor-not-allowed group shadow-sm" dir="ltr">
                    <Shield className="w-4 h-4 text-emerald-200 group-hover:text-primary transition-colors" />
                    {data.email}
                    <span className="mr-auto text-[8px] font-black text-emerald-900/20 uppercase tracking-widest">حساب مأمن</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields Section */}
            <div className="card bg-white/80 backdrop-blur-2xl border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 rounded-full blur-[50px] -ml-24 -mb-24" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-10 border-b border-emerald-50 pb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                    <Pen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">تحديث البيانات</h3>
                    <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mt-1">تأكد من إدخال معلومات دقيقة للتواصل</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* Name Input */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2">الاسم الكامل الجديد</label>
                    <div className="relative group">
                      <User className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl py-5 pr-14 pl-6 text-emerald-950 font-bold placeholder:text-emerald-900/10 focus:bg-white focus:border-primary transition-all outline-none"
                        placeholder="أدخل اسمك الكامل..."
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2">رقم الهاتف (05/06/07)</label>
                    <div className="relative group">
                      <Phone className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-primary transition-colors" />
                      <input
                        type="tel"
                        value={form.phone || ""}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl py-5 pr-14 pl-6 text-emerald-950 font-bold placeholder:text-emerald-900/10 focus:bg-white focus:border-primary transition-all outline-none"
                        dir="ltr"
                        placeholder="0555 12 34 56"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2">كلمة المرور الجديدة (اختياري)</label>
                    <div className="relative group">
                      <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-primary transition-colors" />
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl py-5 pr-14 pl-6 text-emerald-950 font-bold placeholder:text-emerald-900/10 focus:bg-white focus:border-primary transition-all outline-none"
                        placeholder="اتركها فارغة إذا كنت لا ترغب في تغييرها"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-emerald-900/30 uppercase tracking-tight mr-2">مستوى الأمان الموصى به: 8 أحرف على الأقل تشمل أرقاماً ورموزاً</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-12 pt-8 border-t border-emerald-50 flex flex-wrap gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-primary text-white font-display font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-900/10 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري تحديث البيانات...
                      </div>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        حفظ التغييرات النهائية
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 py-5 rounded-[1.5rem] font-display font-black text-emerald-900/40 hover:bg-emerald-50 transition-all active:scale-95 flex items-center justify-center gap-3 border-2 border-transparent hover:border-emerald-100"
                  >
                    <X className="w-5 h-5" />
                    إلغاء التعديل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Helper Component ---- */
function InfoRow({
  icon, label, value, dir, subValue
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-medium mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-gray-dark truncate ${value === "غير محدد" ? "text-gray-400" : ""}`} dir={dir}>
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] font-bold text-emerald-950/40 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}
