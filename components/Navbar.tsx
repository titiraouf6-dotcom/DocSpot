"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Logo } from "./Logo";
import { Bell, LogOut, Check, X, Clock, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export function Navbar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Scroll shadow effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const fetchNotifications = useCallback(() => {
    if (!session) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, [session]);

  // Trigger reminder check once and fetch notifications
  useEffect(() => {
    if (session) {
      fetch("/api/cron/reminders").catch(() => {});
      fetchNotifications();

      const interval = setInterval(fetchNotifications, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id || null }),
      });
      if (id) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reminder": return <Clock className="w-4 h-4 text-primary" />;
      case "success": return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  };

  const cleanMessage = (msg: string) => msg.replace(/\s*\[[\w]+\]$/, "");

  const name = session?.user?.name || "";
  const initials = name.split(" ").map((w: string) => w.charAt(0)).slice(0, 2).join("");

  return (
    <nav
      className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 transition-all duration-300"
      style={{
        borderColor: scrolled ? "var(--border-soft)" : "#F3F4F6",
        boxShadow: scrolled ? "var(--shadow-card-hover)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Right side – Logo + Name */}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)" }}
            >
              {initials || <Logo size={22} />}
            </div>
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-lg font-bold text-gray-dark group-hover:text-primary transition-colors duration-200">
                DocSpot
              </span>
              <Logo size={26} />
            </Link>
          </div>

          {/* Left side – Bell + Logout */}
          <div className="flex items-center gap-1">

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="notif-bell-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                aria-label="الإشعارات"
              >
                <Bell
                  className={`w-5 h-5 transition-colors ${unreadCount > 0 ? "text-primary" : "text-gray-500"}`}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 bg-danger text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div
                  className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-100 overflow-hidden z-50 animate-slide-down"
                  style={{
                    maxHeight: "70vh",
                    boxShadow: "0 20px 60px rgba(17,24,39,0.12), 0 4px 16px rgba(17,24,39,0.06)",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/80">
                    <h3 className="font-bold text-gray-dark text-sm flex items-center gap-2">
                      الإشعارات
                      {unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAsRead()}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          قراءة الكل
                        </button>
                      )}
                      <button
                        onClick={() => setShowDropdown(false)}
                        className="p-1 rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 52px)" }}>
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">لا توجد إشعارات</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                          className={`w-full text-right px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-all duration-150 hover:bg-gray-50 cursor-pointer ${!n.isRead ? "bg-primary/[0.03]" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform ${!n.isRead ? "bg-primary/10" : "bg-gray-100"}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold truncate ${!n.isRead ? "text-gray-dark" : "text-gray-500"}`}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-gray-medium mt-0.5 leading-relaxed line-clamp-2">
                              {cleanMessage(n.message)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 text-gray-500 hover:text-danger px-3 py-2 rounded-xl hover:bg-red-50 transition-all duration-200 text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
