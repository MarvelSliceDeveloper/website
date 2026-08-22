/**
 * StudentPortalShell — the main layout wrapper for all student-facing views.
 *
 * Renders a sticky header with logo, breadcrumbs, notifications, and user controls,
 * plus a scrollable <main> content area. Child views are passed via `children`.
 *
 * Key features:
 * - Sticky header with --shell-header-height CSS variable for child height calculations
 * - Notification bell with real-time polling (30s interval), mark read individually/all
 * - Responsive: email hidden on mobile, breadcrumbs hidden below md breakpoint
 *
 * @example
 * <StudentPortalShell breadcrumbs={[{ label: "Courses" }]} showBack onBack={() => ...}>
 *   <CoursesView />
 * </StudentPortalShell>
 */
"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconX,
  IconLogout,
  IconSettings,
  IconEye,
  IconBook,
  IconInbox,
  IconUser,
  IconChevronDown,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";
import { useSocket, RealtimeNotification } from "@/lib/use-socket";
import MobileBottomNav from "@/components/MobileBottomNav";

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface StudentPortalShellProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  onBack?: () => void;
  showBack?: boolean;
  studentName?: string;
  studentEmail?: string;
  hideProfile?: boolean;
  hideLogo?: boolean;
  hideHeader?: boolean;
  fullWidth?: boolean;
  hideMobileNav?: boolean;
}

// Student portal shell with header, breadcrumbs, and notifications
export default function StudentPortalShell({
  children,
  breadcrumbs = [],
  onBack,
  showBack = false,
  studentName = "Student",
  studentEmail = "student@example.com",
  hideProfile = false,
  hideLogo = false,
  hideHeader = false,
  fullWidth = false,
  hideMobileNav = false,
}: StudentPortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchNotifications());
    let interval = setInterval(fetchNotifications, 120000);
    function handleVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchNotifications();
        interval = setInterval(fetchNotifications, 120000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications]);

  useSocket(
    useCallback((newNotif: RealtimeNotification) => {
      const item: NotificationItem = {
        id: newNotif.id || `rt-${Date.now()}`,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        read: false,
        createdAt: newNotif.createdAt || new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }, []),
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Mark all notifications as read
  async function markAllRead() {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }

  // Mark a single notification as read
  async function markOneRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  }

  // Log out the user and redirect to login
  async function handleSignOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/login");
  }

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-background"
      style={
        { "--shell-header-height": headerHeight + "px" } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      {!hideHeader && (
        <header
          ref={headerRef}
          className="sticky top-0 z-40 border-b border-border bg-card"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {!hideLogo && (
                <div
                  className="flex items-center gap-2 cursor-pointer select-none group"
                  onClick={() => router.push("/student")}
                >
                  <Image
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    width={40}
                    height={40}
                    className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
                    <span className="text-brand-blue">Marvel</span>
                    <span className="text-brand-orange ml-0.5">Slice</span>
                  </span>
                </div>
              )}

              <button
                onClick={onBack}
                className={`sp-back-btn flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted transition-all hover:border-primary/40 hover:text-foreground ${
                  showBack
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-label="Go back"
              >
                <IconArrowLeft size={15} stroke={2} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {breadcrumbs.length > 0 && (
                <nav className="hidden min-w-0 items-center gap-1 overflow-hidden text-xs text-muted md:flex">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-border">/</span>}
                      {crumb.onClick ? (
                        <button
                          onClick={crumb.onClick}
                          className="max-w-35 truncate transition-colors hover:text-foreground"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="max-w-35 truncate text-muted-foreground">
                          {crumb.label}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div ref={notifRef} className="relative">
                <button
                  id="sp-notif-btn"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-slate transition-colors hover:bg-hairline hover:text-ink"
                  aria-label="Notifications"
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                >
                  <IconBell size={17} stroke={1.8} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        Notifications
                      </p>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="text-muted hover:text-foreground"
                        >
                          <IconX size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted">
                          No notifications
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`group flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <NotificationIcon
                                type={n.type}
                                withContainer={false}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-snug text-foreground">
                                {n.message}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.read && (
                                <button
                                  onClick={() => markOneRead(n.id)}
                                  className="rounded-lg p-1 text-muted hover:text-primary hover:bg-primary/10"
                                  title="Mark as read"
                                >
                                  <IconEye size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="border-t border-border px-4 py-2.5">
                        <button
                          onClick={() => {
                            router.push("/student/inbox");
                            setNotifOpen(false);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          View all notifications
                          <IconArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!hideProfile && (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl bg-mist px-3 py-1.5 text-slate transition-colors hover:bg-hairline hover:text-ink"
                    aria-label="Profile menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-[12px] font-bold text-white">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-[13px] font-medium sm:inline">
                      {studentName}
                    </span>
                    <IconChevronDown
                      size={14}
                      className={`shrink-0 text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border bg-card py-1.5 shadow-2xl origin-top-right"
                      style={{
                        animation: "dropdown-in 0.15s ease-out both",
                      }}
                    >
                      <div className="border-b border-border px-4 py-2.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {studentName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {studentEmail}
                        </p>
                      </div>

                      {[
                        { label: "Courses", icon: IconBook, href: "/student?view=courses", match: () => pathname === "/student" && searchParams.get("view") === "courses" },
                        { label: "Inbox", icon: IconInbox, href: "/student/inbox", match: () => pathname.startsWith("/student/inbox") },
                        { label: "Profile", icon: IconUser, href: "/student/settings", match: () => pathname.startsWith("/student/settings") },
                      ].map((item) => {
                        const isActive = item.match();
                        return (
                          <button
                            key={item.label}
                            onClick={() => { router.push(item.href); setProfileOpen(false); }}
                            className={`group flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground hover:bg-primary/8 hover:text-primary"
                            }`}
                          >
                            <item.icon
                              size={16}
                              className={`shrink-0 transition-colors ${
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-primary"
                              }`}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger transition-all hover:bg-danger/10"
                        >
                          <IconLogout size={16} className="shrink-0 text-danger/70 group-hover:text-danger transition-colors" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main
        className={`w-full ${
          hideHeader || fullWidth
            ? ""
            : `mx-auto max-w-7xl px-4 ${
                hideMobileNav ? "py-6" : "pt-6 pb-20 md:pb-6"
              } md:px-6`
        }`}
      >
        {children}
      </main>

      {!hideMobileNav && (
        <MobileBottomNav
          studentName={studentName}
          studentEmail={studentEmail}
          onLogout={handleSignOut}
        />
      )}
    </div>
  );
}
