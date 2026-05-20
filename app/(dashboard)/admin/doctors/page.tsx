"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Stethoscope, CheckCircle, XCircle, Clock, FileText, ExternalLink, RefreshCw } from "lucide-react";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDoctors = () => {
    setLoading(true);
    fetch("/api/admin/doctors").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setDoctors(data);
    }).catch(() => toast.error("فشل")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleAction = async (doctorId: string, action: string) => {
    setActionLoading(doctorId);
    try {
      const res = await fetch("/api/admin/doctors", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, action }) });
      if (res.ok) { toast.success("تم التحديث"); fetchDoctors(); } else toast.error("فشل");
    } catch { toast.error("خطأ"); } finally { setActionLoading(null); }
  };

  const statusLabels: Record<string, { text: string; cls: string }> = {
    PENDING_VERIFICATION: { text: "قيد التحقق", cls: "bg-amber-100 text-amber-700" },
    VERIFIED: { text: "تم التحقق", cls: "bg-blue-100 text-blue-700" },
    SUBSCRIPTION_WAITING_APPROVAL: { text: "انتظار الاشتراك", cls: "bg-orange-100 text-orange-700" },
    ACTIVE: { text: "نشط", cls: "bg-primary/10 text-primary" },
    REJECTED: { text: "مرفوض", cls: "bg-red-100 text-red-700" },
  };

  const hasPendingRenewal = (doc: any) =>
    doc.subscriptionStatus === "ACTIVE" &&
    doc.subscriptionRequests?.length > 0;

  const filtered = filter === "all"
    ? doctors
    : filter === "PENDING_RENEWAL"
      ? doctors.filter(d => hasPendingRenewal(d))
      : doctors.filter(d => d.subscriptionStatus === filter);

  // Count renewal requests for the filter badge
  const renewalCount = doctors.filter(d => hasPendingRenewal(d)).length;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-dark">إدارة الأطباء</h1>
      <div className="flex gap-2 flex-wrap">
        {[
          { v: "all", l: "الكل" },
          { v: "PENDING_VERIFICATION", l: "قيد التحقق" },
          { v: "SUBSCRIPTION_WAITING_APPROVAL", l: "انتظار الاشتراك" },
          { v: "PENDING_RENEWAL", l: `طلب تجديد${renewalCount > 0 ? ` (${renewalCount})` : ""}` },
          { v: "ACTIVE", l: "نشط" },
        ].map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.v
                ? f.v === "PENDING_RENEWAL"
                  ? "bg-teal-600 text-white"
                  : "bg-primary text-white"
                : "bg-white text-gray-medium border border-gray-200"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((doc) => {
          const st = statusLabels[doc.subscriptionStatus] || statusLabels.PENDING_VERIFICATION;
          const pendingRenewal = hasPendingRenewal(doc);
          const renewalRequest = pendingRenewal ? doc.subscriptionRequests[0] : null;

          const planLabels: Record<string, string> = { MONTHLY: "شهري", YEARLY: "سنوي" };

          return (
            <div key={doc.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Stethoscope className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h3 className="font-bold text-gray-dark">د. {doc.user.name}</h3>
                    <p className="text-sm text-gray-medium">{doc.specialization} - {doc.wilaya}, {doc.commune}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{doc.user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span>

                  {/* Renewal badge */}
                  {pendingRenewal && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      طلب تجديد ({planLabels[renewalRequest.plan] || renewalRequest.plan})
                    </span>
                  )}

                  {doc.certificateUrl && (
                    <a href={doc.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><FileText className="w-3 h-3" />الوثيقة</a>
                  )}
                  {doc.paymentProofUrl && (
                    <a href={doc.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" />وصل الدفع</a>
                  )}

                  {/* Renewal payment proof (from the pending request) */}
                  {pendingRenewal && renewalRequest.paymentProofUrl && (
                    <a href={renewalRequest.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-xs flex items-center gap-1 font-bold"><ExternalLink className="w-3 h-3" />وصل التجديد</a>
                  )}

                  {doc.subscriptionStatus === "PENDING_VERIFICATION" && (
                    <>
                      <button onClick={() => handleAction(doc.id, "verify")} disabled={actionLoading === doc.id} className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1"><CheckCircle className="w-4 h-4" />قبول</button>
                      <button onClick={() => handleAction(doc.id, "reject")} disabled={actionLoading === doc.id} className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1"><XCircle className="w-4 h-4" />رفض</button>
                    </>
                  )}
                  {doc.subscriptionStatus === "SUBSCRIPTION_WAITING_APPROVAL" && (
                    <>
                      <button onClick={() => handleAction(doc.id, "approve_subscription")} disabled={actionLoading === doc.id} className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1"><CheckCircle className="w-4 h-4" />قبول الاشتراك</button>
                      <button onClick={() => handleAction(doc.id, "reject_subscription")} disabled={actionLoading === doc.id} className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1"><XCircle className="w-4 h-4" />رفض</button>
                    </>
                  )}

                  {/* Renewal approve/reject buttons */}
                  {pendingRenewal && (
                    <>
                      <button onClick={() => handleAction(doc.id, "approve_subscription")} disabled={actionLoading === doc.id} className="text-xs !px-3 !py-1.5 flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all"><CheckCircle className="w-4 h-4" />قبول التجديد</button>
                      <button onClick={() => handleAction(doc.id, "reject_subscription")} disabled={actionLoading === doc.id} className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1"><XCircle className="w-4 h-4" />رفض التجديد</button>
                    </>
                  )}
                </div>
              </div>

              {/* Renewal info bar */}
              {pendingRenewal && doc.subscriptionExpiresAt && (
                <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 text-teal-700 font-bold">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>طلب تجديد اشتراك</span>
                  </div>
                  <div className="text-teal-600">
                    الخطة: <span className="font-bold">{planLabels[renewalRequest.plan] || renewalRequest.plan}</span>
                  </div>
                  <div className="text-teal-600">
                    الاشتراك الحالي ينتهي: <span className="font-bold">{new Date(doc.subscriptionExpiresAt).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div className="text-teal-600">
                    تاريخ الطلب: <span className="font-bold">{new Date(renewalRequest.createdAt).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
