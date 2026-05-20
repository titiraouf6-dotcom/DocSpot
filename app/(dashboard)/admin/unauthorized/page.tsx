"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-dark mb-3">لا تملك الصلاحيات الكافية</h1>
      <p className="text-gray-medium max-w-md mb-8">
        عذراً، لا يمكنك الوصول إلى هذه الصفحة لعدم امتلاكك الصلاحيات اللازمة. يرجى التواصل مع المشرف الرئيسي إذا كنت تعتقد أن هذا خطأ.
      </p>
      <button 
        onClick={() => router.back()} 
        className="btn-primary flex items-center gap-2 bg-gray-800 hover:bg-gray-700 shadow-none border-0"
      >
        <ArrowRight className="w-5 h-5" />
        العودة للصفحة السابقة
      </button>
    </div>
  );
}
