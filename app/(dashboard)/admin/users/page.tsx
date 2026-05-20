"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Shield, ShieldOff, Search, X } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchUsers = () => {
    fetch("/api/admin/users").then(r => r.json()).then(data => { if (Array.isArray(data)) setUsers(data); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (userId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
      if (res.ok) { toast.success("تم"); fetchUsers(); } else toast.error("فشل");
    } catch { toast.error("خطأ"); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "short", day: "numeric" });
  const roleLabels: Record<string, string> = { PATIENT: "مريض", DOCTOR: "طبيب", ADMIN: "مدير" };

  const doctorStatusLabels: Record<string, string> = {
    PENDING_VERIFICATION: "قيد التحقق",
    VERIFIED: "تم التحقق",
    REJECTED: "مرفوض",
    SUBSCRIPTION_WAITING_APPROVAL: "بانتظار الاشتراك",
    ACTIVE: "نشط",
  };

  const doctorStatusColors: Record<string, string> = {
    PENDING_VERIFICATION: "text-amber-600 bg-amber-50",
    VERIFIED: "text-blue-600 bg-blue-50",
    REJECTED: "text-red-600 bg-red-50",
    SUBSCRIPTION_WAITING_APPROVAL: "text-orange-600 bg-orange-50",
    ACTIVE: "text-primary bg-emerald-50",
  };

  const getUserStatus = (u: any): { label: string; colorClass: string; key: string } => {
    if (u.isBlocked) return { label: "محظور", colorClass: "text-danger bg-red-50", key: "BLOCKED" };
    if (u.role === "DOCTOR" && u.subscriptionStatus) {
      return {
        label: doctorStatusLabels[u.subscriptionStatus] || u.subscriptionStatus,
        colorClass: doctorStatusColors[u.subscriptionStatus] || "text-gray-600 bg-gray-50",
        key: u.subscriptionStatus,
      };
    }
    return { label: "نشط", colorClass: "text-primary bg-emerald-50", key: "ACTIVE" };
  };

  // Filter users by name, role, and status
  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim() && !u.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (statusFilter !== "ALL") {
      const status = getUserStatus(u);
      if (status.key !== statusFilter) return false;
    }
    return true;
  });

  const hasActiveFilters = roleFilter !== "ALL" || statusFilter !== "ALL" || searchQuery.trim() !== "";

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-dark">المستخدمون</h1>
        <span className="text-sm text-gray-medium">
          {hasActiveFilters ? `${filteredUsers.length} من ${users.length} مستخدم` : `${users.length} مستخدم`}
        </span>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مستخدم بالاسم..."
            className="input-field pr-12 pl-12 w-full"
            id="search-users-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <select
          id="filter-role"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setStatusFilter("ALL"); }}
          className="input-field w-full sm:w-44 appearance-none cursor-pointer"
        >
          <option value="ALL">كل الأدوار</option>
          <option value="PATIENT">مريض</option>
          <option value="DOCTOR">طبيب</option>
          <option value="ADMIN">مدير</option>
        </select>

        {/* Status Filter */}
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full sm:w-48 appearance-none cursor-pointer"
        >
          <option value="ALL">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="BLOCKED">محظور</option>
          {roleFilter === "DOCTOR" && (
            <>
              <option value="PENDING_VERIFICATION">قيد التحقق</option>
              <option value="VERIFIED">تم التحقق</option>
              <option value="REJECTED">مرفوض</option>
              <option value="SUBSCRIPTION_WAITING_APPROVAL">بانتظار الاشتراك</option>
            </>
          )}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-medium">
              {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : "لا يوجد مستخدمون"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-right py-3 px-3 font-medium text-gray-medium">الاسم</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">البريد</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">الدور</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">التاريخ</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">الحالة</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">إجراء</th>
            </tr></thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-3 font-medium text-gray-dark">{u.name}</td>
                  <td className="py-3 px-3 text-gray-medium" dir="ltr">{u.email}</td>
                  <td className="py-3 px-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100">{roleLabels[u.role] || u.role}</span></td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{fmtDate(u.createdAt)}</td>
                  <td className="py-3 px-3">
                    {(() => {
                      const s = getUserStatus(u);
                      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.colorClass}`}>{s.label}</span>;
                    })()}
                  </td>
                  <td className="py-3 px-3">
                    {u.role !== "ADMIN" && (
                      u.isBlocked ? (
                        <button onClick={() => handleAction(u.id, "unblock")} className="text-primary text-xs flex items-center gap-1"><Shield className="w-3 h-3" />إلغاء الحظر</button>
                      ) : (
                        <button onClick={() => handleAction(u.id, "block")} className="text-danger text-xs flex items-center gap-1"><ShieldOff className="w-3 h-3" />حظر</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
