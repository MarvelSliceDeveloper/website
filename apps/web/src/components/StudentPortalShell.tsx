"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconArrowLeft,
  IconBell,
  IconChevronDown,
  IconSchool,
  IconLogout,
  IconSettings,
  IconUser,
  IconX,
} from "@tabler/icons-react";

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface StudentPortalShellProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  onBack?: () => void;
  showBack?: boolean;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
}

export interface NotificationItem {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: "live" | "recording" | "mentorship" | "general";
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", message: "🔴 Python Day 12 is LIVE now — Join session!", time: "Just now", read: false, type: "live" },
  { id: "n2", message: "📹 Recording for Day 11 is now available", time: "2 hours ago", read: false, type: "recording" },
  { id: "n3", message: "🎓 Your mentorship session has been scheduled", time: "Yesterday", read: true, type: "mentorship" },
];

export default function StudentPortalShell({
  children,
  breadcrumbs = [],
  onBack,
  showBack = false,
  onMarkAllRead,
}: StudentPortalShellProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onMarkAllRead?.();
  }

  const notifTypeColor = (type: NotificationItem["type"]) => {
    if (type === "live") return "bg-danger/20 border-danger/30";
    if (type === "recording") return "bg-accent/20 border-accent/30";
    if (type === "mentorship") return "bg-primary/20 border-primary/30";
    return "bg-card border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">

          {/* Left: Back + Logo */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Back button */}
            <button
              onClick={onBack}
              className={`sp-back-btn flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted transition-all hover:border-primary/40 hover:text-foreground ${
                showBack ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              aria-label="Go back"
            >
              <IconArrowLeft size={15} stroke={2} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Logo — always returns to home */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600">
                <IconSchool size={17} className="text-white" />
              </div>
              <span className="hidden text-sm font-bold tracking-tight text-foreground sm:inline">
                LMS <span className="text-primary">Portal</span>
              </span>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden min-w-0 items-center gap-1 overflow-hidden text-xs text-muted md:flex">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-border">/</span>}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="max-w-[120px] truncate transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="max-w-[140px] truncate text-muted-foreground">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Notification bell + Avatar */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                id="sp-notif-btn"
                onClick={() => { setNotifOpen((v) => !v); setAvatarOpen(false); }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
                aria-label="Notifications"
              >
                <IconBell size={17} stroke={1.8} />
                {unreadCount > 0 && (
                  <span className="live-pulse absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {notifOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-foreground">
                        <IconX size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`border-b border-border/50 px-4 py-3 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                        >
                          <p className="text-sm leading-snug text-foreground">{n.message}</p>
                          <p className="mt-1 text-[11px] text-muted">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Dropdown */}
            <div ref={avatarRef} className="relative">
              <button
                id="sp-avatar-btn"
                onClick={() => { setAvatarOpen((v) => !v); setNotifOpen(false); }}
                className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-hover"
                aria-label="User menu"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-[11px] font-bold text-white">
                  A
                </div>
                <span className="hidden sm:inline">Arjun</span>
                <IconChevronDown size={13} className="text-muted" />
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-11 z-50 w-44 rounded-2xl border border-border bg-card shadow-2xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Arjun Kumar</p>
                    <p className="text-[11px] text-muted">student@example.com</p>
                  </div>
                  <div className="p-1.5">
                    {[
                      { icon: IconUser, label: "Profile", id: "sp-avatar-profile" },
                      { icon: IconSettings, label: "Settings", id: "sp-avatar-settings" },
                    ].map(({ icon: Icon, label, id }) => (
                      <button
                        key={id}
                        id={id}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                      >
                        <Icon size={15} stroke={1.8} />
                        {label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-border" />
                    <button
                      id="sp-avatar-signout"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                    >
                      <IconLogout size={15} stroke={1.8} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
