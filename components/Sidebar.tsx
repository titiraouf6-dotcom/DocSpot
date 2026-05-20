"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Calendar, Wallet, Settings,
  Users, Clock, Stethoscope, CreditCard, Banknote,
  ClipboardList, LayoutDashboard, ShieldCheck
} from "lucide-react";

const patientLinks = [
  { href: "/patient", label: "الرئيسية", icon: Home },
  { href: "/patient/search", label: "البحث عن طبيب", icon: Search },
  { href: "/patient/appointments", label: "مواعيدي", icon: Calendar },
  { href: "/patient/wallet", label: "محفظتي", icon: Wallet },
  { href: "/patient/settings", label: "الإعدادات", icon: Settings },
];

const doctorLinks = [
  { href: "/doctor", label: "الرئيسية", icon: Home },
  { href: "/doctor/appointments", label: "المواعيد", icon: Calendar },
  { href: "/doctor/patients", label: "المرضى", icon: Users },
  { href: "/doctor/schedule", label: "الجدول", icon: Clock },
  { href: "/doctor/wallet", label: "محفظتي", icon: Wallet },
  { href: "/doctor/settings", label: "الإعدادات", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, perm: "view_dashboard" },
  { href: "/admin/doctors", label: "الأطباء", icon: Stethoscope, perm: "manage_doctors" },
  { href: "/admin/topups", label: "طلبات الشحن", icon: CreditCard, perm: "manage_financials" },
  { href: "/admin/withdrawals", label: "طلبات السحب", icon: Banknote, perm: "manage_financials" },
  { href: "/admin/users", label: "المستخدمون", icon: Users, perm: "manage_users" },
  { href: "/admin/admins", label: "المشرفين", icon: ShieldCheck, perm: "manage_admins" },
  { href: "/admin/logs", label: "السجلات", icon: ClipboardList, perm: "manage_admins" },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings, perm: "manage_settings" },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role;
  const email = session?.user?.email;
  const permissions = (session?.user as any)?.permissions || [];
  const isMainAdmin = email === "admin@docspot.dz";

  let links = role === "PATIENT" ? patientLinks : role === "DOCTOR" ? doctorLinks : [];
  if (role === "ADMIN") {
    links = adminLinks.filter(l => !l.perm || isMainAdmin || permissions.includes(l.perm));
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-l border-gray-100 min-h-[calc(100vh-3.5rem)] p-3"
      style={{ boxShadow: "inset -1px 0 0 #F3F4F6" }}
    >
      <nav className="space-y-0.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group cursor-pointer
                ${active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-dark"
                }
              `}
              style={active ? { boxShadow: "0 1px 4px var(--primary-glow)" } : {}}
            >
              {/* Active indicator bar */}
              <span
                className={`absolute right-0 w-0.5 h-6 rounded-l-full transition-all duration-200 ${
                  active ? "bg-primary opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ${
                  active ? "text-primary" : "group-hover:scale-110"
                }`}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
