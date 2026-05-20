"use client";

import Link from "next/link";

import { useState, useEffect, useRef } from "react";
import {
  User, Mail, Phone, Lock, Save, Shield, MapPin, Globe, FileText,
  Camera, Eye, Pen, X, Check, Stethoscope, Building2, Map,
  Crown, CalendarDays, AlertTriangle, CreditCard
} from "lucide-react";
import { WilayaCommuneSelect } from "@/components/WilayaCommuneSelect";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";

interface DoctorSettings {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  about: string;
  bio: string;
  wilaya: string;
  commune: string;
  googleMapsLink: string;
  insuranceAmount: number;
  profileImageUrl: string;
  ccpNumber: string | null;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
}

export default function DoctorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [supportEmail, setSupportEmail] = useState("contact@docspot.dz");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("profileImage", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setForm((prev) => ({ ...prev, profileImageUrl: res[0].url }));
        toast.success("تم رفع الصورة بنجاح");
      }
      setUploadingImage(false);
    },
    onUploadError: () => {
      toast.error("فشل في رفع الصورة");
      setUploadingImage(false);
    },
  });

  const [data, setData] = useState<DoctorSettings>({
    name: "", email: "", phone: "", specialization: "",
    about: "", bio: "", wilaya: "", commune: "",
    googleMapsLink: "", insuranceAmount: 1000, profileImageUrl: "",
    ccpNumber: null,
    subscriptionStatus: "", subscriptionPlan: null, subscriptionExpiresAt: null,
  });
  const [form, setForm] = useState<DoctorSettings & { password: string }>({
    ...data, password: "",
  });

  useEffect(() => {
    fetch("/api/doctor/settings")
      .then(r => r.json())
      .then(res => {
        if (res && !res.error) {
          setData(res);
          setForm({ ...res, password: "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/public/settings")
      .then(r => r.json())
      .then(res => {
        if (res?.supportEmail) setSupportEmail(res.supportEmail);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/doctor/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          about: form.about,
          bio: form.bio,
          wilaya: form.wilaya,
          commune: form.commune,
          googleMapsLink: form.googleMapsLink,
          insuranceAmount: form.insuranceAmount,
          profileImageUrl: form.profileImageUrl,
          password: form.password,
        }),
      });
      if (res.ok) {
        toast.success("تم حفظ التغييرات بنجاح");
        // Update the view data
        setData({
          ...data,
          phone: form.phone,
          about: form.about,
          bio: form.bio,
          wilaya: form.wilaya,
          commune: form.commune,
          googleMapsLink: form.googleMapsLink,
          insuranceAmount: form.insuranceAmount,
          profileImageUrl: form.profileImageUrl,
        });
        setEditMode(false);
      } else {
        toast.error("فشل في حفظ التغييرات");
      }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 4 ميجابايت");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة");
      return;
    }

    setUploadingImage(true);
    startUpload([file]);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w.charAt(0)).slice(0, 2).join("");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // ============ VIEW MODE ============
  if (!editMode) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto pb-10 animate-fade-in-up">
        {/* ─── Page Title ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><User className="w-8 h-8 text-primary" /></div>
              إعدادات الحساب
            </h1>
            <p className="text-gray-medium text-sm font-medium">قم بإدارة ملفك الشخصي، تفاصيل العيادة، وحالة اشتراكك.</p>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="group relative bg-primary text-white font-display font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden"
          >
            <Pen className="w-5 h-5 transition-transform group-hover:rotate-12" />
            تعديل الملف الشخصي
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ─── Profile Header Card ────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-10 text-white shadow-2xl shadow-emerald-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px] -ml-24 -mb-24" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Profile Image */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-95 group-hover:scale-110 transition-transform duration-500" />
                  {data.profileImageUrl ? (
                    <img
                      src={data.profileImageUrl}
                      alt={data.name}
                      className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="relative w-36 h-36 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center text-white text-5xl font-display font-black shadow-2xl group-hover:scale-105 transition-transform duration-500">
                      {getInitials(data.name)}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -left-2 bg-primary border-4 border-white rounded-2xl p-2 shadow-xl">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Name & Specialty */}
                <div className="text-center md:text-right space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-display font-black tracking-tight">د. {data.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                        {data.specialization}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 text-emerald-100/70">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold">{data.wilaya} — {data.commune}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold" dir="ltr">{data.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Personal Info Card ─────────────────────────────────────── */}
            <div className="card space-y-8 border-2 border-emerald-50 bg-white">
              <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
                <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  المعلومات الأساسية
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow icon={<User className="w-4 h-4" />} label="الاسم الكامل" value={`د. ${data.name}`} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="البريد الإلكتروني" value={data.email} dir="ltr" />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="رقم الهاتف" value={data.phone || "غير محدد"} dir="ltr" />
                <InfoRow icon={<Stethoscope className="w-4 h-4" />} label="التخصص" value={data.specialization} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="الولاية" value={data.wilaya || "غير محدد"} />
                <InfoRow icon={<Map className="w-4 h-4" />} label="البلدية" value={data.commune || "غير محدد"} />
                <InfoRow icon={<Globe className="w-4 h-4" />} label="رابط الخريطة" value={data.googleMapsLink || "غير محدد"} dir="ltr" isLink />
                <InfoRow icon={<Shield className="w-4 h-4" />} label="مبلغ التأمين" value={`${data.insuranceAmount.toLocaleString()} د.ج`} />
                
                {/* CCP Section */}
                <div className="md:col-span-2 relative group overflow-hidden bg-gray-50 border-2 border-transparent hover:border-emerald-50 hover:bg-white rounded-3xl p-6 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/50 text-primary flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-medium uppercase tracking-widest mb-0.5">حساب CCP</p>
                        <h4 className="text-sm font-bold text-gray-dark">تفاصيل الحساب البنكي</h4>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-400 bg-gray-100/80 px-3 py-1 rounded-full uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      مجمّد
                    </span>
                  </div>
                  
                  {data.ccpNumber ? (
                    <div className="grid grid-cols-[1fr_auto] gap-6">
                      <div className="bg-white/50 border border-emerald-50 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">رقم الحساب</p>
                        <p className="font-display font-black text-2xl text-gray-dark tracking-[0.2em]" dir="ltr">
                          {data.ccpNumber.split(" Clé ")[0] || data.ccpNumber}
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center min-w-[80px]">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">مفتاح</p>
                        <span className="font-display font-black text-2xl text-primary-dark">
                          {data.ccpNumber.split(" Clé ")[1] || "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-bold italic">لم يتم إدخاله عند التسجيل</p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Bio & About Card ──────────────────────────────────────── */}
            <div className="card space-y-8 border-2 border-emerald-50 bg-white">
              <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
                <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  السيرة والوصف
                </h3>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-4 rounded-full bg-primary" />
                    <p className="text-xs font-black text-gray-medium uppercase tracking-widest">نبذة تعريفية</p>
                  </div>
                  <div className="bg-emerald-50/20 rounded-3xl p-8 border-2 border-emerald-50/50">
                    <p className="text-gray-dark leading-loose font-medium whitespace-pre-wrap italic">
                      {data.about || "لم تتم إضافة نبذة بعد."}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-4 rounded-full bg-primary" />
                    <p className="text-xs font-black text-gray-medium uppercase tracking-widest">المؤهلات والخبرات</p>
                  </div>
                  <div className="bg-emerald-50/20 rounded-3xl p-8 border-2 border-emerald-50/50">
                    <p className="text-gray-dark leading-loose font-medium whitespace-pre-wrap">
                      {data.bio || "لم تتم إضافة سيرة ذاتية بعد."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* ─── Subscription Card ─────────────────────────────────────── */}
            <SubscriptionCard
              status={data.subscriptionStatus}
              plan={data.subscriptionPlan}
              expiresAt={data.subscriptionExpiresAt}
            />

            {/* Quick Actions / Tips */}
            <div className="card bg-gradient-to-br from-primary to-primary-dark text-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-display font-black">تحتاج مساعدة؟</h4>
                  <p className="text-emerald-100/80 text-sm leading-relaxed">إذا كنت ترغب في تغيير معلوماتك المجمّدة أو لديك استفسار حول اشتراكك، لا تتردد في التواصل معنا.</p>
                </div>
                <a
                  href={`mailto:${supportEmail}?subject=${encodeURIComponent('طلب دعم فني - DocSpot')}`}
                  className="block w-full py-4 rounded-2xl bg-white text-primary-dark font-display font-black text-sm hover:bg-emerald-50 transition-all active:scale-95 text-center"
                >
                  تواصل مع الدعم الفني
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ EDIT MODE ============
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-10 animate-fade-in-up">
      {/* ─── Page Title ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Pen className="w-8 h-8 text-primary" /></div>
            تعديل الملف الشخصي
          </h1>
          <p className="text-gray-medium text-sm font-medium">قم بتحديث معلوماتك العامة والطبية لظهور أفضل للمرضى.</p>
        </div>
        <button
          onClick={handleCancel}
          className="px-8 py-4 rounded-2xl border-2 border-emerald-100 text-gray-dark font-display font-bold text-sm hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95"
        >
          <X className="w-5 h-5 text-red-500" />
          إلغاء التعديلات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          {/* ─── Profile Image Upload ───────────────────────────────────── */}
          <div className="card text-center space-y-6">
            <h3 className="text-lg font-display font-extrabold text-gray-dark border-b border-emerald-50 pb-4 mb-6">الصورة الشخصية</h3>
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-95 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              {form.profileImageUrl ? (
                <img
                  src={form.profileImageUrl}
                  alt="الصورة الشخصية"
                  className="relative w-48 h-48 rounded-full object-cover border-6 border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border-6 border-white flex items-center justify-center text-primary text-6xl font-display font-black shadow-2xl">
                  {getInitials(data.name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 rounded-full bg-emerald-950/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white cursor-pointer"
              >
                <Camera className="w-10 h-10 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">تحديث الصورة</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full py-4 rounded-2xl bg-emerald-50 text-primary-dark font-display font-black text-xs hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                {uploadingImage ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    جاري الرفع...
                  </span>
                ) : (
                  "اختر ملف صورة جديد"
                )}
              </button>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JPG, PNG — أقصى حجم 4 ميجابايت</p>
            </div>
          </div>

          {/* ─── Frozen Fields Card ─────────────────────────────────────── */}
          <div className="card space-y-6 bg-gray-50/50 border-2 border-gray-100">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-2">
              <Lock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-display font-extrabold text-gray-500 uppercase tracking-tight">بيانات مجمّدة</h3>
            </div>
            
            <div className="space-y-5">
              {[
                { label: 'الاسم الكامل', value: data.name, icon: User },
                { label: 'البريد الإلكتروني', value: data.email, icon: Mail },
                { label: 'التخصص الطبي', value: data.specialization, icon: Stethoscope },
              ].map((field, i) => (
                <div key={i} className="space-y-1.5 opacity-60">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2 flex items-center gap-2">
                    <field.icon className="w-3 h-3" />
                    {field.label}
                  </label>
                  <div className="bg-white border-2 border-gray-100 px-5 py-3 rounded-2xl text-sm font-bold text-gray-400 flex items-center justify-between">
                    {field.value}
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed bg-white/50 p-4 rounded-2xl border border-gray-100">
                  ⚠️ هذه البيانات مجمّدة لأسباب أمنية وتدقيقية. يرجى التواصل مع الإدارة إذا كنت بحاجة لتغييرها.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {/* ─── Editable Form Fields ───────────────────────────────────── */}
          <div className="card space-y-10 border-2 border-emerald-50 bg-white">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
              <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                  < Pen className="w-5 h-5" />
                </div>
                المعلومات العامة والعيادة
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Password */}
              <div className="space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-dark font-bold py-4 px-6 rounded-2xl transition-all outline-none"
                  placeholder="اتركها فارغة للأمان"
                />
                <p className="text-[10px] text-gray-400 font-bold pr-2">يجب أن تكون 6 أحرف على الأقل في حال التغيير.</p>
              </div>

              {/* Phone */}
              <div className="space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={form.phone || ""}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-dark font-bold py-4 px-6 rounded-2xl transition-all outline-none"
                  dir="ltr"
                  placeholder="05 / 06 / 07 ..."
                />
              </div>

              {/* Wilaya & Commune */}
              <div className="md:col-span-2">
                <WilayaCommuneSelect
                  wilayaValue={form.wilaya}
                  communeValue={form.commune}
                  onWilayaChange={(v) => setForm({ ...form, wilaya: v, commune: "" })}
                  onCommuneChange={(v) => setForm({ ...form, commune: v })}
                />
              </div>

              {/* Google Maps Link */}
              <div className="md:col-span-2 space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  رابط موقع العيادة (Google Maps)
                </label>
                <input
                  type="url"
                  value={form.googleMapsLink || ""}
                  onChange={e => setForm({ ...form, googleMapsLink: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-dark font-bold py-4 px-6 rounded-2xl transition-all outline-none"
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {/* Insurance Amount */}
              <div className="md:col-span-2 space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  مبلغ التأمين المسترد (د.ج)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.insuranceAmount}
                    onChange={e => setForm({ ...form, insuranceAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-primary-dark text-2xl font-display font-black py-5 pl-20 pr-6 rounded-3xl transition-all outline-none"
                    dir="ltr"
                    min="0"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-200 uppercase tracking-widest pointer-events-none">د.ج</div>
                </div>
              </div>

              {/* About */}
              <div className="md:col-span-2 space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  نبذة مختصرة عنك
                </label>
                <textarea
                  value={form.about || ""}
                  onChange={e => setForm({ ...form, about: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-dark font-bold py-5 px-6 rounded-3xl transition-all outline-none min-h-[120px] resize-none"
                  placeholder="اكتب نبذة تلخص خبرتك لتعريف المرضى بك..."
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-2 group">
                <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide pr-2 flex items-center gap-2">
                  < Pen className="w-4 h-4 text-primary" />
                  السيرة الذاتية المهنية
                </label>
                <textarea
                  value={form.bio || ""}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white text-gray-dark font-bold py-5 px-6 rounded-3xl transition-all outline-none min-h-[180px] resize-none"
                  placeholder="أضف تفاصيل تعليمك، خبراتك العملية، والشهادات المحصل عليها..."
                />
              </div>
            </div>
          </div>

          {/* ─── Save / Cancel Actions ─────────────────────────────────── */}
          <div className="flex items-center gap-6 p-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] group relative bg-primary text-white font-display font-black px-10 py-6 rounded-3xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </div>
              ) : (
                <>
                  <Save className="w-6 h-6 transition-transform group-hover:scale-110" />
                  <span>تأكيد وحفظ التغييرات</span>
                </>
              )}
            </button>
            <button 
              onClick={handleCancel} 
              className="flex-1 py-6 rounded-3xl border-2 border-emerald-100 text-gray-medium font-display font-bold text-sm hover:bg-emerald-50 transition-all active:scale-95"
            >
              تجاهل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Helper Component ---- */
function InfoRow({
  icon, label, value, dir, isLink, locked
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: string;
  isLink?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="group flex items-start gap-4 bg-gray-50 border-2 border-transparent hover:border-emerald-50 hover:bg-white rounded-3xl p-5 transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-300 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-gray-medium uppercase tracking-widest">{label}</p>
          {locked && (
            <span className="inline-flex items-center gap-1 text-[8px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" />
              LOCKED
            </span>
          )}
        </div>
        {isLink && value && value !== "غير محدد" ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-extrabold text-primary hover:underline truncate block"
            dir={dir}
          >
            {value}
          </a>
        ) : (
          <p className={`text-sm font-extrabold text-gray-dark truncate ${value === "غير محدد" || value === "لم يتم إدخاله" ? "text-gray-400 font-medium italic" : ""}`} dir={dir}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Subscription Card Component ---- */
function SubscriptionCard({
  status,
  plan,
  expiresAt,
}: {
  status: string;
  plan: string | null;
  expiresAt: string | null;
}) {
  const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    ACTIVE: { label: "حساب نشط", color: "text-primary-dark", bg: "bg-emerald-50", dot: "bg-primary" },
    VERIFIED: { label: "بانتظار الاشتراك", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
    PENDING_VERIFICATION: { label: "بانتظار التحقق", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
    REJECTED: { label: "حساب مرفوض", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
    DEFAULT: { label: "غير معروف", color: "text-gray-700", bg: "bg-gray-50", dot: "bg-gray-400" }
  };

  const planMap: Record<string, string> = {
    MONTHLY: "الخطة الشهرية",
    YEARLY: "الخطة السنوية",
  };

  const s = statusMap[status] || statusMap.DEFAULT;

  // Calculate remaining days
  let remainingDays: number | null = null;
  let totalDays: number | null = null;
  let progressPercent = 0;

  if (expiresAt && status === "ACTIVE") {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    totalDays = plan === "YEARLY" ? 365 : 30;
    progressPercent = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="card space-y-8 border-2 border-emerald-50 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-primary-dark" />
      
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
            <Crown className="w-5 h-5" />
          </div>
          حالة العضوية
        </h3>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${s.bg} ${s.color}`}>
          <span className={`w-2 h-2 rounded-full ${s.dot} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
          {s.label}
        </span>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نوع الباقة</p>
            <p className="text-lg font-display font-black text-gray-dark">{plan ? planMap[plan] || plan : "لا يوجد اشتراك نشط"}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {status === "ACTIVE" && expiresAt && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">تاريخ الانتهاء</p>
                <p className="text-sm font-bold text-gray-dark">{formatDate(expiresAt)}</p>
              </div>
              <div className="text-left space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الأيام المتبقية</p>
                <p className={`text-lg font-display font-black ${remainingDays && remainingDays <= 7 ? "text-red-500" : "text-primary"}`}>
                  {remainingDays} <span className="text-xs">يوم</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                <span>التقدم</span>
                <span>{Math.round(progressPercent)}% متبقي</span>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden border-2 border-emerald-100 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${remainingDays && remainingDays <= 7 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_12px_rgba(16,185,129,0.4)]"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {remainingDays && remainingDays <= 7 && (
                <p className="text-[10px] text-red-500 font-black text-center animate-bounce mt-2 uppercase tracking-tight">
                  ⚠️ اشتراكك يقترب من الانتهاء، يرجى التجديد قريباً!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-4">
        <Link
          href="/doctor/subscription"
          className="block w-full py-4 rounded-2xl bg-white border-2 border-emerald-100 text-primary-dark font-display font-black text-xs hover:bg-emerald-50 transition-all text-center"
        >
          تجديد أو ترقية الاشتراك
        </Link>
      </div>
    </div>
  );
}
