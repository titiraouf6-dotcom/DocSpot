"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Lock, Unlock, Key, Trash2, Edit } from "lucide-react";

interface Admin {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  createdAt: string;
  adminPermissions: { permissionKey: string }[];
}

const AVAILABLE_PERMISSIONS = [
  { key: "view_dashboard", label: "عرض الإحصائيات (الرئيسية)" },
  { key: "manage_doctors", label: "إدارة الأطباء" },
  { key: "manage_financials", label: "إدارة الشحن والسحب" },
  { key: "manage_users", label: "إدارة المستخدمين" },
  { key: "manage_settings", label: "إدارة الإعدادات" },
  { key: "manage_admins", label: "إدارة المشرفين" },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: "", email: "", password: "", permissions: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (Array.isArray(data)) setAdmins(data);
    } catch {
      toast.error("فشل في تحميل المشرفين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم إضافة المشرف بنجاح");
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", permissions: [] });
        fetchAdmins();
      } else {
        toast.error(data.error || "فشل في الإضافة");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: selectedAdmin.id, permissions: formData.permissions })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم تحديث الصلاحيات بنجاح");
        setShowEditModal(false);
        fetchAdmins();
      } else {
        toast.error(data.error || "فشل في التحديث");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (admin: Admin) => {
    if (admin.email === "admin@docspot.dz") {
      toast.error("لا يمكن حظر المشرف الرئيسي");
      return;
    }
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: admin.id, isBlocked: !admin.isBlocked })
      });
      if (res.ok) {
        toast.success(admin.isBlocked ? "تم فك الحظر" : "تم حظر المشرف");
        fetchAdmins();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل في التحديث");
      }
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-dark flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            إدارة المشرفين
          </h1>
          <p className="text-gray-medium text-sm mt-1">إضافة مشرفين جدد، إدارة الصلاحيات الجزئية، وحظر الحسابات.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: "", email: "", password: "", permissions: [] });
            setShowAddModal(true);
          }} 
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مشرف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map(admin => {
          const isMainAdmin = admin.email === "admin@docspot.dz";
          const permKeys = admin.adminPermissions.map(p => p.permissionKey);
          
          return (
            <div key={admin.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative">
              {isMainAdmin && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                  المشرف الرئيسي
                </div>
              )}
              {admin.isBlocked && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl rounded-tl-2xl flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  محظور
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-extrabold text-xl">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-dark text-lg">{admin.name}</h3>
                  <p className="text-xs text-gray-medium" dir="ltr">{admin.email}</p>
                </div>
              </div>
              
              <div className="mb-4 space-y-2">
                <p className="text-xs font-bold text-gray-400">الصلاحيات الممنوحة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {isMainAdmin ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium">كافة الصلاحيات المطلقة</span>
                  ) : permKeys.length > 0 ? (
                    AVAILABLE_PERMISSIONS.filter(p => permKeys.includes(p.key)).map(p => (
                      <span key={p.key} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-medium">
                        {p.label}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-red-50 text-red-500 rounded-md text-[10px] font-medium">لا توجد صلاحيات (للقراءة فقط)</span>
                  )}
                </div>
              </div>
              
              {!isMainAdmin && (
                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                  <button 
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setFormData({ ...formData, permissions: permKeys });
                      setShowEditModal(true);
                    }}
                    className="flex-1 btn-outline !py-2 text-xs flex items-center justify-center gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  >
                    <Key className="w-3.5 h-3.5" />
                    تعديل الصلاحيات
                  </button>
                  <button 
                    onClick={() => handleToggleBlock(admin)}
                    className={`flex-1 !py-2 text-xs flex items-center justify-center gap-1 rounded-xl font-bold transition-colors ${
                      admin.isBlocked 
                        ? "bg-emerald-50 text-primary-dark hover:bg-emerald-100" 
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {admin.isBlocked ? <><Unlock className="w-3.5 h-3.5" /> فك الحظر</> : <><Lock className="w-3.5 h-3.5" /> حظر الحساب</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-dark mb-5 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-primary" />
              إضافة مشرف جديد
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label-field">الاسم الكامل</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="اسم المشرف" />
              </div>
              <div>
                <label className="label-field">البريد الإلكتروني</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="admin@example.com" dir="ltr" />
              </div>
              <div>
                <label className="label-field">كلمة المرور</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" placeholder="••••••••" dir="ltr" />
              </div>
              
              <div className="pt-2">
                <label className="label-field mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  الصلاحيات
                </label>
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {AVAILABLE_PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(p.key)}
                        onChange={() => togglePermission(p.key)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddSubmit} disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? "جاري الإضافة..." : "حفظ المشرف"}
              </button>
              <button onClick={() => setShowAddModal(false)} className="btn-outline flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-dark mb-2 flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              تعديل صلاحيات المشرف
            </h3>
            <p className="text-sm text-gray-medium mb-5">تعديل صلاحيات: <span className="font-bold text-gray-dark">{selectedAdmin.name}</span></p>
            
            <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {AVAILABLE_PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">{p.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditSubmit} disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button onClick={() => setShowEditModal(false)} className="btn-outline flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
