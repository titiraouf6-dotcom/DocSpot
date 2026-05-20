"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ClipboardList, Calendar as CalendarIcon, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetch("/api/admin/logs")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) => new Date(d).toLocaleString("ar-DZ");

  // Calendar logic
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();
  
  const itemsByDay = useMemo(() => {
    const map: Record<number, number> = {};
    logs.forEach((log) => {
      const d = new Date(log.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map[day] = (map[day] || 0) + 1;
      }
    });
    return map;
  }, [logs, year, month]);

  const monthName = calendarMonth.toLocaleDateString("ar-DZ", { month: "long", year: "numeric" });
  
  const goToPrevMonth = () => setCalendarMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCalendarMonth(new Date(year, month + 1, 1));
  const goToToday = () => { setCalendarMonth(new Date()); setSelectedDate(new Date()); };
  const selectDay = (day: number) => setSelectedDate(new Date(year, month, day));

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  const dateFilteredLogs = selectedDate 
    ? logs.filter(log => {
        const d = new Date(log.createdAt);
        return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
      })
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-dark">سجل الإجراءات</h1>
        
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

      {dateFilteredLogs.length === 0 ? (
        <div className="card text-center py-12"><ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-medium">لا توجد سجلات مطابقة</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-right py-3 px-3 font-medium text-gray-medium">المدير</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">الإجراء</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">التاريخ</th>
              <th className="text-right py-3 px-3 font-medium text-gray-medium">IP</th>
            </tr></thead>
            <tbody>
              {dateFilteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-3 font-medium text-gray-dark">{log.admin.name}</td>
                  <td className="py-3 px-3 text-gray-medium">{log.action}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{fmtDate(log.createdAt)}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs" dir="ltr">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
