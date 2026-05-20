"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Banknote, CheckCircle, XCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const fetchData = () => {
    fetch("/api/admin/withdrawals").then(r => r.json()).then(data => { if (Array.isArray(data)) setWithdrawals(data); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleAction = async (withdrawalId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/withdrawals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ withdrawalId, action }) });
      if (res.ok) { toast.success("تم"); fetchData(); } else toast.error("فشل");
    } catch { toast.error("خطأ"); }
  };

  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });

  // Calendar logic
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();
  
  const itemsByDay = useMemo(() => {
    const map: Record<number, number> = {};
    withdrawals.forEach((w) => {
      const d = new Date(w.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = (map[day] || 0) + 1;
      }
    });
    return map;
  }, [withdrawals, year, month]);

  const monthName = calendarMonth.toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });
  
  const goToPrevMonth = () => setCalendarMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCalendarMonth(new Date(year, month + 1, 1));
  const goToToday = () => { setCalendarMonth(new Date()); setSelectedDate(new Date()); };
  const selectDay = (day: number) => setSelectedDate(new Date(year, month, day));

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  const dateFilteredWithdrawals = selectedDate 
    ? withdrawals.filter(w => {
        const d = new Date(w.createdAt);
        return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
      })
    : withdrawals;

  const filteredWithdrawals = filter === "all" ? dateFilteredWithdrawals : dateFilteredWithdrawals.filter(w => w.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-dark">طلبات السحب</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: `الكل (${dateFilteredWithdrawals.length})` },
            { value: "PENDING", label: "في الانتظار" },
            { value: "APPROVED", label: "مقبولة" },
            { value: "REJECTED", label: "مرفوضة" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === f.value ? "bg-primary text-white" : "bg-white text-gray-medium border border-gray-200 hover:border-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Day Picker */}
        <div className="relative z-20">
          <div
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 min-w-[200px] cursor-pointer"
          >
            <CalendarIcon className="w-5 h-5 text-primary" />
            <div className="text-right">
              <p className="text-xs text-gray-400 leading-none mb-0.5">فلتر الأيام</p>
              <p className="text-sm font-bold text-gray-dark">
                {selectedDate ? selectedDate.toLocaleDateString("ar-DZ", { day: "numeric", month: "long" }) : "كل الأيام"}
              </p>
            </div>
            {selectedDate && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedDate(null); }}
                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center mr-2"
              >
                <XCircle className="w-3 h-3 text-gray-500" />
              </button>
            )}
            <ChevronLeft className={`w-4 h-4 text-gray-400 mr-auto transition-transform duration-200 ${showDatePicker ? "rotate-90" : ""}`} />
          </div>

          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute top-full mt-2 left-0 sm:right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-[320px]" style={{ animation: "modalPop 0.2s ease-out" }}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={goToPrevMonth} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-dark">{monthName}</h3>
                    <button onClick={() => { goToToday(); setShowDatePicker(false); }} className="text-[11px] text-primary font-medium hover:underline">اليوم</button>
                  </div>
                  <button onClick={goToNextMonth} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const count = itemsByDay[day] || 0;
                    const active = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
                    const isToday = todayDate.getDate() === day && todayDate.getMonth() === month && todayDate.getFullYear() === year;
                    return (
                      <button
                        key={day}
                        onClick={() => { selectDay(day); setShowDatePicker(false); }}
                        className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150 ${active ? "bg-primary text-white shadow-md" : isToday ? "bg-primary/10 text-primary font-bold ring-2 ring-primary/30" : "text-gray-dark hover:bg-gray-100"}`}
                      >
                        {day}
                        {count > 0 && <span className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${active ? "bg-white text-primary" : "bg-primary text-white"}`}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 border-t pt-3">
                  <button onClick={() => { setSelectedDate(null); setShowDatePicker(false); }} className="w-full py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">عــرض كــل الأيــام</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {filteredWithdrawals.length === 0 ? (
        <div className="card text-center py-12"><Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-medium">لا توجد طلبات</p></div>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((w) => (
            <div key={w.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold text-gray-dark">د. {w.doctor.user.name}</p>
                  <p className="text-lg font-bold text-primary">{fmt(w.amount)}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(w.createdAt)}</p>

                  {/* CCP - split display for easy reading */}
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="w-4 h-4 text-amber-600" />
                      <p className="text-[11px] text-amber-700 font-bold">حساب CCP للتحويل</p>
                    </div>
                    {w.doctor.ccpNumber ? (
                      <div className="flex items-center gap-3" dir="ltr">
                        {/* Account number */}
                        <div>
                          <p className="text-[9px] text-amber-500 font-medium mb-0.5">رقم الحساب</p>
                          <p className="font-mono text-sm font-bold text-amber-900 tracking-widest">
                            {w.doctor.ccpNumber.split(" Clé ")[0] || w.doctor.ccpNumber}
                          </p>
                        </div>
                        <div className="text-amber-300 font-light text-lg">|</div>
                        {/* Clé */}
                        <div className="text-center">
                          <p className="text-[9px] text-amber-500 font-medium mb-0.5">Clé</p>
                          <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg bg-amber-200 text-amber-900 font-bold font-mono text-sm">
                            {w.doctor.ccpNumber.split(" Clé ")[1] || "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">لم يتم إدخال رقم CCP</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {w.status === "PENDING" ? (
                    <>
                      <button onClick={() => handleAction(w.id, "approve")} className="btn-primary text-xs !px-3 !py-1.5 flex items-center gap-1"><CheckCircle className="w-4 h-4" />قبول</button>
                      <button onClick={() => handleAction(w.id, "reject")} className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1"><XCircle className="w-4 h-4" />رفض</button>
                    </>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${w.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-700"}`}>
                      {w.status === "APPROVED" ? "مقبول" : "مرفوض"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
