"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, CreditCard, Save, DollarSign, Mail, Phone, User } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ccpNumber: "", ccpHolder: "", ccpPhone: "", monthlyPrice: 2000, yearlyPrice: 20000, supportEmail: "contact@docspot.dz" });

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(data => {
      if (data && !data.error) setForm({ ccpNumber: data.ccpNumber || "", ccpHolder: data.ccpHolder || "", ccpPhone: data.ccpPhone || "", monthlyPrice: data.monthlyPrice || 2000, yearlyPrice: data.yearlyPrice || 20000, supportEmail: data.supportEmail || "contact@docspot.dz" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) toast.success("تم حفظ الإعدادات بنجاح"); else toast.error("فشل في حفظ الإعدادات");
    } catch { toast.error("حدث خطأ أثناء الحفظ"); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-dark">إعدادات النظام</h1>
      </div>

      {/* Payment Info Card */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-dark mb-5 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          معلومات الدفع (CCP)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label-field flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              رقم حساب CCP
            </label>
            <input 
              type="text" 
              value={form.ccpNumber} 
              onChange={e => setForm({...form, ccpNumber: e.target.value})} 
              className="input-field" 
              dir="ltr" 
              placeholder="XXXXXXXXXX XX" 
            />
          </div>
          <div>
            <label className="label-field flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              اسم صاحب الحساب
            </label>
            <input 
              type="text" 
              value={form.ccpHolder} 
              onChange={e => setForm({...form, ccpHolder: e.target.value})} 
              className="input-field" 
            />
          </div>
          <div>
            <label className="label-field flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              رقم الهاتف
            </label>
            <input 
              type="tel" 
              value={form.ccpPhone} 
              onChange={e => setForm({...form, ccpPhone: e.target.value})} 
              className="input-field" 
              dir="ltr" 
            />
          </div>
        </div>
      </div>

      {/* Subscription Prices Card */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-dark mb-5 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          أسعار الاشتراك
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              السعر الشهري (د.ج)
            </label>
            <input 
              type="number" 
              value={form.monthlyPrice} 
              onChange={e => setForm({...form, monthlyPrice: parseFloat(e.target.value) || 0})} 
              className="input-field" 
              dir="ltr" 
            />
          </div>
          <div>
            <label className="label-field flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              السعر السنوي (د.ج)
            </label>
            <input 
              type="number" 
              value={form.yearlyPrice} 
              onChange={e => setForm({...form, yearlyPrice: parseFloat(e.target.value) || 0})} 
              className="input-field" 
              dir="ltr" 
            />
          </div>
        </div>
      </div>

      {/* General Settings Card */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-dark mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          إعدادات عامة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label-field flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              البريد الإلكتروني للدعم
            </label>
            <input 
              type="email" 
              value={form.supportEmail} 
              onChange={e => setForm({...form, supportEmail: e.target.value})} 
              className="input-field" 
              dir="ltr" 
              placeholder="contact@docspot.dz" 
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="btn-primary flex items-center gap-2 px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              جاري الحفظ...
            </span>
          ) : (
            <>
              <Save className="w-5 h-5" />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  );
}
