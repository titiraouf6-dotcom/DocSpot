"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users, Stethoscope, Calendar, Heart, Activity,
  TrendingUp, ArrowLeft, CreditCard, Banknote,
  AlertCircle, ShieldCheck, PieChart, ArrowUpRight, ArrowDownRight, UserPlus
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  monthlyAppointments: { month: string; count: number }[];
  subscriptionStats: { status: string; count: number }[];
  financialStats?: {
    pendingTopups: number;
    pendingWithdrawals: number;
    totalTopupAmount: number;
    totalWithdrawalAmount: number;
    totalSubscriptionIncome: number;
  };
  newUsersPeriod?: number;
  newDoctorsPeriod?: number;
  newPatientsPeriod?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    setLoading(true);
    let url = `/api/admin/stats?year=${selectedYear}`;
    if (selectedMonth) {
      url += `&month=${selectedMonth}`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => toast.error("فشل في تحميل الإحصائيات"))
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear]);

  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-primary animate-spin"></div>
        <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-b-blue-500 animate-spin absolute inset-4"></div>
      </div>
      <p className="text-gray-medium font-medium animate-pulse">جاري تحميل البيانات...</p>
    </div>
  );

  const statusLabels: Record<string, string> = {
    PENDING_VERIFICATION: "قيد التحقق",
    VERIFIED: "تم التحقق",
    SUBSCRIPTION_WAITING_APPROVAL: "انتظار الاشتراك",
    ACTIVE: "نشط",
    REJECTED: "مرفوض",
  };

  const statusColors: Record<string, string> = {
    PENDING_VERIFICATION: "bg-amber-100 text-amber-700 border-amber-200",
    VERIFIED: "bg-blue-100 text-blue-700 border-blue-200",
    SUBSCRIPTION_WAITING_APPROVAL: "bg-purple-100 text-purple-700 border-purple-200",
    ACTIVE: "bg-emerald-100 text-primary-dark border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-dark tracking-tight">نظرة عامة على المنصة</h1>
          <p className="text-gray-medium mt-1">مرحباً بعودتك! إليك ملخص الأداء والإحصائيات الخاصة بـ DocSpot.</p>
        </div>
        
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-dark outline-none cursor-pointer"
            >
              <option value="">كل الأوقات</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>شهر {m}</option>
              ))}
            </select>
            <span className="text-gray-300">/</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-dark outline-none cursor-pointer"
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Link href="/admin/settings" className="btn-primary flex items-center gap-2 shadow-md">
            <ShieldCheck className="w-4 h-4" /> إعدادات النظام
          </Link>
        </div>
      </div>

      {/* Action Needed Alerts */}
      {((stats?.financialStats?.pendingTopups ?? 0) > 0 || (stats?.financialStats?.pendingWithdrawals ?? 0) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.financialStats?.pendingTopups ?? 0) > 0 && (
            <div className="bg-gradient-to-l from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm shadow-amber-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">طلبات شحن معلقة</h4>
                  <p className="text-xs text-amber-700">يوجد {stats?.financialStats?.pendingTopups ?? 0} طلبات شحن تنتظر المراجعة.</p>
                </div>
              </div>
              <Link href="/admin/topups" className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
                مراجعة
              </Link>
            </div>
          )}
          {(stats?.financialStats?.pendingWithdrawals ?? 0) > 0 && (
            <div className="bg-gradient-to-l from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm shadow-blue-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">طلبات سحب معلقة</h4>
                  <p className="text-xs text-blue-700">يوجد {stats?.financialStats?.pendingWithdrawals ?? 0} طلبات سحب تنتظر المعالجة.</p>
                </div>
              </div>
              <Link href="/admin/withdrawals" className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                مراجعة
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm text-gray-medium font-medium mb-1">إجمالي المستخدمين</p>
              <h3 className="text-3xl font-extrabold text-gray-dark">{stats?.totalUsers.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary relative z-10">
            <TrendingUp className="w-3 h-3" /> {selectedMonth ? `+${stats?.newUsersPeriod} في هذا الشهر` : "منصة متنامية"}
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm text-gray-medium font-medium mb-1">المرضى المسجلين</p>
              <h3 className="text-3xl font-extrabold text-gray-dark">{stats?.totalPatients.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-600 relative z-10">
            <UserPlus className="w-3 h-3" /> {selectedMonth ? `+${stats?.newPatientsPeriod} مريض في هذا الشهر` : "من إجمالي المستخدمين"}
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm text-gray-medium font-medium mb-1">الأطباء المعتمدين</p>
              <h3 className="text-3xl font-extrabold text-gray-dark">{stats?.activeDoctors.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-600 relative z-10">
            <Activity className="w-3 h-3" /> {selectedMonth ? `+${stats?.newDoctorsPeriod} طبيب في هذا الشهر` : "نشط على المنصة"}
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm text-gray-medium font-medium mb-1">{selectedMonth ? "الحجوزات في الشهر" : "إجمالي الحجوزات"}</p>
              <h3 className="text-3xl font-extrabold text-gray-dark">{stats?.totalAppointments.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-purple-600 relative z-10">
            <PieChart className="w-3 h-3" /> عبر جميع العيادات
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subscription Income */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Activity className="w-48 h-48 -mr-10 -mb-10" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-200 mb-2 font-medium">
              <Banknote className="w-4 h-4" />
              مداخيل الاشتراكات
            </div>
            <h2 className="text-4xl font-extrabold mb-1" dir="ltr">{fmt(stats?.financialStats?.totalSubscriptionIncome || 0)}</h2>
            <p className="text-sm text-indigo-300">إجمالي مدفوعات اشتراك الأطباء</p>
          </div>
        </div>

        {/* Topups Volume */}
        <div className="bg-gradient-to-br from-primary-dark to-primary text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <ArrowUpRight className="w-48 h-48 -mr-10 -mb-10" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 mb-2 font-medium">
              <CreditCard className="w-4 h-4" />
              حجم الشحن المعتمد
            </div>
            <h2 className="text-4xl font-extrabold mb-1" dir="ltr">{fmt(stats?.financialStats?.totalTopupAmount || 0)}</h2>
            <p className="text-sm text-emerald-200">إجمالي عمليات الشحن الناجحة للمرضى</p>
          </div>
        </div>

        {/* Withdrawals Volume */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-dark text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute left-0 bottom-0 opacity-10">
            <ArrowDownRight className="w-48 h-48 -ml-10 -mb-10" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-300 mb-2 font-medium">
              <Banknote className="w-4 h-4" />
              حجم السحوبات المعتمدة
            </div>
            <h2 className="text-4xl font-extrabold mb-1" dir="ltr">{fmt(stats?.financialStats?.totalWithdrawalAmount || 0)}</h2>
            <p className="text-sm text-slate-400">إجمالي الأرباح المسحوبة للأطباء</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Appointments Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-gray-dark flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                تحليل المواعيد
              </h3>
              <p className="text-xs text-gray-medium mt-1">نمو الحجوزات الطبية خلال الأشهر الماضية</p>
            </div>
          </div>
          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...(stats?.monthlyAppointments || [])].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ color: '#0891B2', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" name="عدد المواعيد" stroke="#0891B2" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-extrabold text-gray-dark flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              حالة الأطباء
            </h3>
            <p className="text-xs text-gray-medium mt-1">توزيع الأطباء حسب حالة الحساب</p>
          </div>
          
          <div className="flex-1 space-y-4 flex flex-col justify-center">
            {(stats?.subscriptionStats || []).length > 0 ? (
              (stats?.subscriptionStats || []).map((s, i) => {
                const total = stats?.totalDoctors || 1;
                const percentage = Math.round((s.count / total) * 100);
                const colorClass = statusColors[s.status] || "bg-gray-100 text-gray-700 border-gray-200";
                const label = statusLabels[s.status] || s.status;
                
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${colorClass}`}>
                        {label}
                      </span>
                      <span className="font-bold text-gray-dark text-sm">{s.count} <span className="text-gray-400 font-normal text-xs">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass.split(' ')[0].replace('100', '500')}`} 
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">لا توجد بيانات متاحة</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
