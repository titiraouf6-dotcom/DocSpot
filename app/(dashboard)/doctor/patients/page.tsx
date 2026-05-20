"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lastVisit: string;
  lastStatus: string;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/doctor/patients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPatients(data); })
      .catch(() => toast.error("فشل"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const filtered = patients.filter((p) => p.name.includes(search) || p.email.includes(search));

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Users className="w-8 h-8 text-primary" /></div>
            قائمة المرضى
          </h1>
          <p className="text-gray-medium text-sm font-medium">عرض وإدارة قاعدة بيانات المرضى الذين قاموا بزيارة عيادتك.</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-field pr-12 py-4 text-gray-dark font-bold border-2 border-emerald-50 focus:border-primary focus:shadow-lg focus:shadow-primary/5 transition-all" 
            placeholder="البحث بالاسم أو البريد..." 
          />
        </div>
      </div>

      {/* ─── Patients Grid ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-24 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
            <Users className="w-12 h-12 text-emerald-200" />
          </div>
          <h3 className="text-2xl font-display font-extrabold text-gray-dark mb-2">لم يتم العثور على نتائج</h3>
          <p className="text-gray-medium text-sm max-w-sm leading-relaxed">
            لا توجد سجلات مرضى تطابق بحثك حالياً. يمكنك تجربة كلمات بحث مختلفة أو التحقق لاحقاً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filtered.map((p) => (
            <div key={p.id} className="card group hover:bg-emerald-50/20 transition-all duration-300 hover:scale-[1.02] border-2 border-emerald-50 hover:border-emerald-100">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-white shadow-sm flex items-center justify-center text-primary-dark font-display font-extrabold text-2xl group-hover:scale-110 transition-transform">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-display font-extrabold text-gray-dark mb-0.5">{p.name}</h3>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-emerald-50/50">
                <div className="flex items-center gap-3 text-sm text-gray-medium font-medium group-hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-200 group-hover:text-primary">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span dir="ltr">{p.email}</span>
                </div>
                
                {p.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-medium font-medium">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-200 group-hover:text-primary">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span dir="ltr">{p.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm text-gray-medium font-medium">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-200 group-hover:text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>آخر زيارة: {formatDate(p.lastVisit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
