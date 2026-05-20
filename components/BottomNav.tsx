"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Calendar, Wallet, Settings,
  Users, Clock, Stethoscope, CreditCard, Banknote,
  ClipboardList, LayoutDashboard
} from "lucide-react";

const patientLinks = [
  { href: "/patient", label: "الرئيسية", icon: Home },
  { href: "/patient/search", label: "البحث", icon: Search },
  { href: "/patient/appointments", label: "المواعيد", icon: Calendar },
  { href: "/patient/wallet", label: "المحفظة", icon: Wallet },
  { href: "/patient/settings", label: "الإعدادات", icon: Settings },
];

const doctorLinks = [
  { href: "/doctor", label: "الرئيسية", icon: Home },
  { href: "/doctor/appointments", label: "الجدول", icon: Calendar },
  { href: "/doctor/patients", label: "المرضى", icon: Users },
  { href: "/doctor/wallet", label: "المحفظة", icon: Wallet },
  { href: "/doctor/settings", label: "الإعدادات", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "الأطباء", icon: Stethoscope },
  { href: "/admin/topups", label: "الشحن", icon: CreditCard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role;
  const links = role === "PATIENT" ? patientLinks : role === "DOCTOR" ? doctorLinks : adminLinks;

  return (
    <div className="bottom-nav">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            {/* Active pip indicator */}
            {active && (
              <span
                className="absolute -top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
