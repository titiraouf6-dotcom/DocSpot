"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { wilayas } from "@/lib/constants/wilayas";
import { specializations } from "@/lib/constants/specializations";
import { Search, MapPin, Star, Stethoscope, Shield, ExternalLink, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  wilaya: string;
  commune: string;
  about: string | null;
  insuranceAmount: number;
  profileImageUrl: string | null;
  avgRating: number;
  reviewCount: number;
  googleMapsLink: string;
}

export default function PatientSearchPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.set("search", searchText);
      if (selectedWilaya) params.set("wilaya", selectedWilaya);
      if (selectedCommune) params.set("commune", selectedCommune);
      if (selectedSpec) params.set("specialization", selectedSpec);

      const res = await fetch(`/api/patient/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch {
      toast.error("فشل في البحث");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ar-DZ").format(amount) + " د.ج";

  return (
    <div className="space-y-10 pb-10 animate-fade-in-up">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-10 md:p-14 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse-slow" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <Search className="w-8 h-8 text-emerald-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">البحث الذكي</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4 leading-tight">
            ابحث عن <span className="text-emerald-300">طبيبك المثالي</span>
          </h1>
          <p className="text-emerald-50/70 text-lg font-medium max-w-2xl leading-relaxed">
            تصفح قائمة واسعة من الأطباء المتخصصين، قارن بين التقييمات، واحجز موعدك فوراً بكل أمان وسهولة.
          </p>
        </div>
      </div>

      {/* Search Filters — Compact Single Row */}
      <form onSubmit={handleSearch} className="relative z-20 -mt-12 mx-2">
        <div className="flex flex-col lg:flex-row items-stretch gap-3 bg-white/90 backdrop-blur-2xl border-2 border-emerald-100/60 rounded-[2rem] p-3 shadow-2xl shadow-emerald-900/8">
          {/* Search Input */}
          <div className="relative flex-[2] min-w-0 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-full bg-emerald-50/40 border border-emerald-100/40 rounded-xl py-3 pr-10 pl-3 text-sm text-emerald-950 font-bold placeholder:text-emerald-900/25 focus:bg-white focus:border-primary/50 transition-all outline-none"
              placeholder="اسم الطبيب..."
            />
          </div>

          {/* Specialization */}
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="flex-[1.5] min-w-0 bg-emerald-50/40 border border-emerald-100/40 rounded-xl py-3 px-3 text-sm text-emerald-950 font-bold focus:bg-white focus:border-primary/50 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">التخصص</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Wilaya */}
          <select
            value={selectedWilaya}
            onChange={(e) => { setSelectedWilaya(e.target.value); setSelectedCommune(""); }}
            className="flex-[1.5] min-w-0 bg-emerald-50/40 border border-emerald-100/40 rounded-xl py-3 px-3 text-sm text-emerald-950 font-bold focus:bg-white focus:border-primary/50 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">الولاية</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
            ))}
          </select>

          {/* Commune */}
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            disabled={!selectedWilaya}
            className="flex-[1.5] min-w-0 bg-emerald-50/40 border border-emerald-100/40 rounded-xl py-3 px-3 text-sm text-emerald-950 font-bold focus:bg-white focus:border-primary/50 transition-all outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">البلدية</option>
            {selectedWilaya && wilayas.find((w) => w.name === selectedWilaya)?.communes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Search Button */}
          <button type="submit" className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white font-display font-black px-8 py-3 rounded-xl shadow-lg shadow-emerald-900/10 hover:scale-[1.03] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
            <Search className="w-4 h-4" />
            بحث
          </button>
        </div>
      </form>

      {/* Results Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-4 bg-emerald-50 rounded-full animate-pulse" />
          </div>
          <p className="text-emerald-900/40 font-black uppercase tracking-widest text-xs">جاري جلب قائمة الأطباء...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="card bg-emerald-50/10 border-dashed border-2 border-emerald-100 py-32 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner animate-bounce-slow">
            <Stethoscope className="w-12 h-12 text-emerald-200" />
          </div>
          <h3 className="text-2xl font-display font-extrabold text-emerald-950 mb-2">لم نجد أي نتائج</h3>
          <p className="text-emerald-900/50 text-base max-w-sm leading-relaxed mb-4">
            جرب استخدام كلمات بحث مختلفة أو تغيير معايير الولاية والتخصص.
          </p>
          <button onClick={() => { setSearchText(""); setSelectedWilaya(""); setSelectedCommune(""); setSelectedSpec(""); fetchDoctors(); }} className="text-primary font-black uppercase tracking-widest text-xs hover:underline">إعادة ضبط البحث</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/patient/doctor/${doctor.id}`}
              className="card group hover:shadow-2xl hover:shadow-emerald-900/10 hover:scale-[1.03] transition-all duration-500 border-2 border-emerald-50/50 overflow-hidden flex flex-col h-full"
            >
              {/* Card Header with Image/Initials */}
              <div className="flex items-start gap-5 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-primary rounded-[1.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                  {doctor.profileImageUrl ? (
                    <img
                      src={doctor.profileImageUrl}
                      alt={doctor.name}
                      className="relative w-20 h-20 rounded-[1.25rem] object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-[1.25rem] bg-gradient-to-br from-emerald-900 to-emerald-950 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-display font-black">
                      {doctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  <h3 className="text-2xl font-display font-extrabold text-emerald-950 truncate group-hover:text-primary transition-colors leading-tight mb-2">
                    د. {doctor.name}
                  </h3>
                  <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 shadow-sm">
                    <Stethoscope className="w-3 h-3" />
                    {doctor.specialization}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="space-y-5 flex-1">
                <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 group-hover:bg-white transition-colors duration-500">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest leading-none mb-1">الموقع</p>
                    <p className="text-sm font-bold text-emerald-900 truncate leading-none">{doctor.wilaya}، {doctor.commune}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1.5" />
                      <span className="text-sm font-display font-black text-amber-900">
                        {doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) : "—"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-900/30 uppercase tracking-tight">({doctor.reviewCount} تقييم)</span>
                  </div>
                  
                  <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest leading-none mb-1">تأمين الحجز</p>
                    <p className="text-lg font-display font-black text-primary-dark leading-none" dir="ltr">{formatCurrency(doctor.insuranceAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-8 pt-6 border-t border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest">حجز مؤمن</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-display font-black text-sm group-hover:translate-x-[-4px] transition-transform">
                  عرض الملف وحجز <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
