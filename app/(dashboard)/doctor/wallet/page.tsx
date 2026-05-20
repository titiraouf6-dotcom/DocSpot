"use client";

import { useState, useEffect } from "react";
import {
  Wallet, Banknote, Clock, CheckCircle, XCircle,
  AlertCircle, ArrowDownRight, ArrowUpRight, Info
} from "lucide-react";
import { toast } from "sonner";

const MIN_WITHDRAWAL = 10_000;

export default function DoctorWalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number | "">("");
  const [requesting, setRequesting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchWallet = async () => {
    const data = await fetch("/api/doctor/wallet").then(r => r.json());
    setBalance(data.walletBalance || 0);
    setTransactions(data.transactions || []);
    setWithdrawals(data.withdrawals || []);
    setMonthlyIncome(data.monthlyIncome || 0);
    setWithdrawalCount(data.withdrawalCount || 0);
  };

  useEffect(() => {
    fetchWallet().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const hasPendingWithdrawal = withdrawals.some(w => w.status === "PENDING");
  const numAmount = Number(amount) || 0;
  const isAmountValid = numAmount >= MIN_WITHDRAWAL && numAmount <= balance;

  const handleWithdraw = async () => {
    if (numAmount < MIN_WITHDRAWAL) {
      toast.error(`الحد الأدنى للسحب هو ${fmt(MIN_WITHDRAWAL)}`);
      return;
    }
    if (numAmount > balance) {
      toast.error("رصيد غير كافٍ");
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch("/api/doctor/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم إرسال طلب السحب بنجاح");
        setAmount("");
        setShowWithdrawModal(false);
        await fetchWallet();
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setRequesting(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("ar-DZ").format(n) + " د.ج";
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-extrabold text-gray-dark flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Wallet className="w-8 h-8 text-primary" /></div>
            محفظتي المالية
          </h1>
          <p className="text-gray-medium text-sm font-medium">تتبع أرباحك، معاملاتك، وقم بإدارة طلبات سحب الأموال الخاصة بك.</p>
        </div>
        <button
          id="withdraw-money-btn"
          onClick={() => setShowWithdrawModal(true)}
          disabled={hasPendingWithdrawal}
          className="group relative bg-primary text-white font-display font-bold px-10 py-4 rounded-2xl shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasPendingWithdrawal ? "لديك طلب سحب قيد الانتظار" : ""}
        >
          <Banknote className="w-6 h-6" />
          <span>سحب المال</span>
        </button>
      </div>

      {/* ─── Pending Notification ──────────────────────────────────────── */}
      {hasPendingWithdrawal && (
        <div className="flex items-center gap-4 bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 animate-pulse-slow">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-amber-900 font-extrabold text-sm mb-0.5">طلب سحب قيد المعالجة</h4>
            <p className="text-amber-700 text-xs font-medium">
              لديك طلب سحب حالي قيد الانتظار. يرجى الانتظار حتى تتم معالجته قبل إرسال طلب جديد.
            </p>
          </div>
        </div>
      )}

      {/* ─── Balance & Stats Card ─────────────────────────────────────── */}
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-12 text-white shadow-2xl shadow-emerald-900/20">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Wallet className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-emerald-100/90">إجمالي الرصيد القابل للسحب</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">محدث الآن</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-6xl font-display font-extrabold tracking-tight drop-shadow-lg leading-tight">
                {balance.toLocaleString('ar-DZ')} <span className="text-2xl text-emerald-300">د.ج</span>
              </p>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                الحد الأدنى للسحب: <span className="text-white font-black">{fmt(MIN_WITHDRAWAL)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-1">دخل هذا الشهر</p>
              <p className="text-2xl font-display font-extrabold">+{monthlyIncome.toLocaleString('ar-DZ')} <span className="text-xs">د.ج</span></p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors">
              <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-1">عمليات السحب</p>
              <p className="text-2xl font-display font-extrabold">{withdrawalCount} <span className="text-xs">عملية</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ─── Transaction History ─────────────────────────────────────── */}
        <div className="card space-y-8 border-2 border-emerald-50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
            <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              سجل المعاملات
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">عرض الكل</button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                <Info className="w-8 h-8" />
              </div>
              <p className="text-gray-medium font-bold">لا توجد معاملات مالية بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((t: any) => (
                <div
                  key={t.id}
                  className="group flex items-center justify-between p-4 rounded-2xl border-2 border-transparent hover:border-emerald-50 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-emerald-100/20"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        t.type === "INCOME"
                          ? "bg-emerald-50 text-primary"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {t.type === "INCOME" ? (
                        <ArrowDownRight className="w-6 h-6" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-dark text-sm group-hover:text-primary transition-colors">{t.description}</p>
                      <p className="text-[10px] font-bold text-gray-medium mt-1 flex items-center gap-1 uppercase tracking-tight">
                        <Clock className="w-3 h-3 text-emerald-200" />
                        {fmtDate(t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-display font-black tracking-tight ${t.type === "INCOME" ? "text-primary-dark" : "text-red-600"}`}
                      dir="ltr"
                    >
                      {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-black text-gray-medium uppercase tracking-widest">د.ج</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Withdrawal History ──────────────────────────────────────── */}
        <div className="card space-y-8 border-2 border-emerald-50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-6">
            <h3 className="text-xl font-display font-extrabold text-gray-dark flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                <Banknote className="w-5 h-5" />
              </div>
              طلبات السحب
            </h3>
            <span className="bg-emerald-50 text-primary-dark px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {withdrawals.length} طلبات
            </span>
          </div>

          {withdrawals.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                <Banknote className="w-8 h-8" />
              </div>
              <p className="text-gray-medium font-bold">لم تقم بأي عمليات سحب مسبقاً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-emerald-100 hover:bg-white transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-dark font-black text-xs">
                      $
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-dark text-sm">{fmt(w.amount)}</p>
                      <p className="text-[10px] font-bold text-gray-medium uppercase tracking-tight">{fmtDate(w.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                      w.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : w.status === "APPROVED"
                        ? "bg-emerald-50 text-primary-dark border-emerald-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                  >
                    {w.status === "PENDING"
                      ? "قيد الانتظار"
                      : w.status === "APPROVED"
                      ? "مكتمل"
                      : "مرفوض"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Withdraw Modal ──────────────────────────────────────────── */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md" />

          <div
            className="relative bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(6,78,59,0.3)] w-full max-w-lg overflow-hidden border border-emerald-100"
            onClick={e => e.stopPropagation()}
            style={{ animation: "modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Modal Header */}
            <div className="px-10 py-12 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                  <Banknote className="w-8 h-8 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-display font-extrabold tracking-tight">سحب الأموال</h3>
                  <p className="text-emerald-300/80 font-bold text-sm">حدد المبلغ الذي ترغب في تحويله إلى حسابك.</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-10 space-y-8 bg-white">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">رصيدك الحالي</p>
                  <p className="text-xl font-display font-black text-emerald-900">{fmt(balance)}</p>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 text-center">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">الحد الأدنى</p>
                  <p className="text-xl font-display font-black text-amber-900">{fmt(MIN_WITHDRAWAL)}</p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <label className="text-sm font-extrabold text-gray-dark uppercase tracking-wide">المبلغ المراد سحبه</label>
                  {amount !== "" && !isAmountValid && (
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">مبلغ غير مسموح به!</span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-200 group-focus-within:text-primary transition-colors">د.ج</div>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className={`w-full bg-gray-50/50 border-3 text-3xl font-display font-black py-6 pl-20 pr-6 rounded-3xl transition-all outline-none text-right
                      ${amount !== "" && !isAmountValid ? "border-red-100 focus:border-red-300 text-red-900" : "border-gray-100 focus:border-primary text-primary-dark shadow-inner"}
                    `}
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Quick Amount Selection */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-medium uppercase tracking-widest px-2">اختيار سريع</p>
                <div className="grid grid-cols-3 gap-3">
                  {[MIN_WITHDRAWAL, balance > 50000 ? 50000 : 20000, balance].map((v, i) => (
                    <button
                      key={`${v}-${i}`}
                      type="button"
                      onClick={() => setAmount(v)}
                      className={`py-4 rounded-2xl text-xs font-black transition-all border-3
                        ${numAmount === v
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-white text-gray-dark border-emerald-50 hover:border-primary hover:text-primary"}
                      `}
                    >
                      {i === 2 ? "الكل" : fmt(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-5 rounded-2xl border-2 border-gray-100 text-gray-medium font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={requesting || !isAmountValid}
                  className="flex-[2] py-5 rounded-2xl bg-primary text-white font-display font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
                >
                  {requesting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري المعالجة...</span>
                    </div>
                  ) : (
                    "تأكيد عملية السحب"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
