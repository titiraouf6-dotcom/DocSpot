"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PaymentInfoCard } from "@/components/PaymentInfoCard";
import { FileUpload } from "@/components/FileUpload";
import { Wallet, Upload, Clock, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, Info, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TopupRequest {
  id: string;
  amount: number;
  paymentProofUrl: string;
  status: string;
  createdAt: string;
}

export default function PatientWalletPage() {
  const { data: session } = useSession();
  const [walletAvailable, setWalletAvailable] = useState(0);
  const [walletFrozen, setWalletFrozen] = useState(0);
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/patient/wallet");
      if (res.ok) {
        const data = await res.json();
        setWalletAvailable(data.walletAvailable);
        setWalletFrozen(data.walletFrozen);
        setTopups(data.topups || []);
        setTransactions(data.transactions || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopup = async () => {
    if (!amount || amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صالح");
      return;
    }
    if (!paymentProofUrl) {
      toast.error("الرجاء رفع وصل الدفع");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/patient/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentProofUrl }),
      });
      if (res.ok) {
        toast.success("تم إرسال طلب الشحن بنجاح، في انتظار المراجعة");
        setAmount(0);
        setPaymentProofUrl("");
        fetchWallet();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل في إرسال الطلب");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ar-DZ").format(amount) + " د.ج";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* ─── Wallet Balance Card ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-7 md:p-9 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] -mr-24 -mt-24" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
              <Wallet className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100/60">الرصيد الإجمالي</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-primary rounded-xl blur opacity-15 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px]">
                <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest leading-none mb-2 opacity-60">الرصيد المتاح</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-display font-black tracking-tight">{walletAvailable.toLocaleString("ar-DZ")}</p>
                  <span className="text-sm font-bold opacity-60">د.ج</span>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl blur opacity-10 group-hover:opacity-25 transition-opacity" />
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px]">
                <p className="text-[9px] font-black text-amber-200 uppercase tracking-widest leading-none mb-2 opacity-60">الرصيد المجمد</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-display font-black tracking-tight text-amber-200">{walletFrozen.toLocaleString("ar-DZ")}</p>
                  <span className="text-sm font-bold text-amber-200/60">د.ج</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-amber-100/40 uppercase tracking-tight bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                  <Info className="w-3 h-3" />
                  مخصص لمواعيد قادمة
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 stagger-children">
        {/* ─── Topup Form ──────────────────────────────────────────────── */}
        <div className="space-y-8">
          <div className="card bg-white/80 backdrop-blur-2xl border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-[40px] -mr-16 -mt-16" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">شحن الرصيد</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2 mb-2">مبلغ الإيداع</label>
                  <div className="relative group/input">
                    <input
                      type="number"
                      value={amount || ""}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl py-5 px-6 text-2xl font-display font-black text-emerald-950 placeholder:text-emerald-900/10 focus:bg-white focus:border-primary transition-all outline-none"
                      placeholder="0.00"
                      dir="ltr"
                      min={0}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-900/20 uppercase tracking-widest group-focus-within/input:text-primary transition-colors">DZD</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest block ml-2 mb-2">إيصال الدفع</label>
                  <div className="p-1 rounded-[1.75rem] bg-gradient-to-br from-emerald-100 to-primary/20">
                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                      <FileUpload
                        endpoint="paymentProof"
                        value={paymentProofUrl}
                        onChange={setPaymentProofUrl}
                        className="!border-0 !bg-transparent hover:!bg-emerald-50/30 !transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-emerald-900/70 leading-relaxed">
                      يتم التحقق من طلبات الإيداع يدوياً خلال <span className="text-emerald-950 font-black">2-4 ساعات</span>. يرجى إرفاق صورة واضحة لوصل التحويل.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTopup}
                  disabled={submitting || !amount || !paymentProofUrl}
                  className="w-full bg-primary text-white font-display font-black py-5 rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري معالجة الطلب...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      تأكيد وإرسال طلب الشحن
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="transform hover:scale-[1.02] transition-transform duration-500">
            <PaymentInfoCard className="!rounded-[2.5rem] !shadow-2xl !shadow-emerald-900/5 !border-2 !border-emerald-50" />
          </div>
        </div>

        {/* ─── Transaction History ──────────────────────────────────────── */}
        <div className="card bg-white/80 backdrop-blur-2xl border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 flex flex-col h-full relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-[40px] -ml-16 -mb-16" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">سجل المعاملات</h3>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mb-6 text-emerald-200">
                  <Wallet className="w-10 h-10" />
                </div>
                <p className="text-emerald-900/40 font-bold">لا توجد معاملات مسجلة بعد</p>
              </div>
            ) : (
              <div className="space-y-6">
                {transactions.map((t: any) => (
                  <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        t.type === "TOPUP" || t.type === "REFUND" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      }`}>
                        {t.type === "TOPUP" || t.type === "REFUND" ? <ArrowDownCircle className="w-7 h-7" /> : <ArrowUpCircle className="w-7 h-7" />}
                      </div>
                      <div>
                        <p className="font-display font-extrabold text-emerald-950 text-base leading-tight group-hover:text-primary transition-colors">{t.description}</p>
                        <p className="text-[10px] font-black text-emerald-900/30 mt-2 uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(t.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xl font-display font-black ${t.type === "TOPUP" || t.type === "REFUND" ? "text-emerald-600" : "text-red-600"}`} dir="ltr">
                      {t.type === "TOPUP" || t.type === "REFUND" ? "+" : "-"}{t.amount.toLocaleString("ar-DZ")} <span className="text-xs">د.ج</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Topups History ─────────────────────────────────────────── */}
        <div className="card bg-white/80 backdrop-blur-2xl border-2 border-emerald-50 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-[40px] -ml-16" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-emerald-950 tracking-tight">سجل طلبات الشحن</h3>
              </div>
            </div>

            {topups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mb-6 text-emerald-200">
                  <Upload className="w-10 h-10" />
                </div>
                <p className="text-emerald-900/40 font-bold">لا توجد طلبات شحن معلقة</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-emerald-100/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-emerald-50/50 text-[10px] font-black text-emerald-900/40 uppercase tracking-widest text-right">
                      <th className="py-5 px-8">التاريخ</th>
                      <th className="py-5 px-8">المبلغ</th>
                      <th className="py-5 px-8">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {topups.map((t) => (
                      <tr key={t.id} className="group hover:bg-emerald-50/30 transition-colors">
                        <td className="py-5 px-8 font-bold text-emerald-950 text-sm">{formatDate(t.createdAt)}</td>
                        <td className="py-5 px-8">
                          <div className="text-lg font-display font-black text-primary" dir="ltr">
                            {t.amount.toLocaleString("ar-DZ")} <span className="text-xs">د.ج</span>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          {t.status === "PENDING" && (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                              <Clock className="w-3 h-3" />
                              قيد المراجعة
                            </span>
                          )}
                          {t.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-primary text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                              <CheckCircle className="w-3 h-3" />
                              تم الشحن
                            </span>
                          )}
                          {t.status === "REJECTED" && (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm">
                              <XCircle className="w-3 h-3" />
                              مرفوض
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
