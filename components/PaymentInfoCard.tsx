"use client";

import { CreditCard, Phone, User, Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PaymentInfo {
  ccpNumber: string;
  ccpHolder: string;
  ccpPhone: string;
}

interface PaymentInfoCardProps {
  className?: string;
}

export function PaymentInfoCard({ className = "" }: PaymentInfoCardProps) {
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/payment-info")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setInfo(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`تم نسخ ${label}`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className={`bg-blue-50 rounded-2xl p-6 animate-pulse ${className}`}>
        <div className="h-6 bg-blue-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!info || (!info.ccpNumber && !info.ccpHolder)) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-2xl p-6 ${className}`}>
        <p className="text-blue-600 text-center">معلومات الدفع غير متوفرة حالياً</p>
      </div>
    );
  }

  const items = [
    { label: "رقم حساب CCP", value: info.ccpNumber, icon: CreditCard },
    { label: "اسم صاحب الحساب", value: info.ccpHolder, icon: User },
    { label: "رقم الهاتف", value: info.ccpPhone, icon: Phone },
  ];

  return (
    <div
      className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold">معلومات الدفع (CCP)</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 opacity-80" />
                <div>
                  <p className="text-xs opacity-80">{item.label}</p>
                  <p className="font-semibold text-sm" dir="ltr">
                    {item.value || "—"}
                  </p>
                </div>
              </div>
              {item.value && (
                <button
                  onClick={() => copyToClipboard(item.value, item.label)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                  title="نسخ"
                >
                  {copied === item.label ? (
                    <CheckCircle className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4 opacity-70" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
