/**
 * StudentPortalShell — the main layout wrapper for all student-facing views.
 *
 * Renders a sticky header with logo, breadcrumbs, notifications, and user controls,
 * plus a scrollable <main> content area. Child views are passed via `children`.
 *
 * Key features:
 * - Sticky header with --shell-header-height CSS variable for child height calculations
 * - Notification bell with real-time polling (30s interval), mark read individually/all
 * - Theme toggle (light/dark) with localStorage persistence
 * - Responsive: email hidden on mobile, breadcrumbs hidden below md breakpoint
 *
 * @example
 * <StudentPortalShell breadcrumbs={[{ label: "Courses" }]} showBack onBack={() => ...}>
 *   <CoursesView />
 * </StudentPortalShell>
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconMoon,
  IconSun,
  IconX,
  IconLogout,
  IconSettings,
  IconEye,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";

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
}: StudentPortalShellProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const saved = window.localStorage.getItem("lms-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("lms-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
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
      className="min-h-screen bg-background"
      style={
        { "--shell-header-height": headerHeight + "px" } as React.CSSProperties
      }
    >
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
                  <img
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                      Marvel
                    </span>
                    <span className="text-indigo-500 ml-0.5">Slice</span>
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
              {!hideProfile && (
                <>
                  <span
                    className="hidden max-w-[200px] truncate px-1 text-[13px] text-muted-foreground sm:inline"
                    title={studentEmail}
                  >
                    {studentEmail}
                  </span>

                  <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
                </>
              )}

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "light" ? (
                  <IconSun size={17} stroke={1.8} />
                ) : (
                  <IconMoon size={17} stroke={1.8} />
                )}
              </button>

              <div ref={notifRef} className="relative">
                <button
                  id="sp-notif-btn"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
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
                <>
                  <button
                    onClick={() => router.push("/student/settings")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
                    aria-label="Settings"
                    title={studentName}
                  >
                    <IconSettings size={17} stroke={1.8} />
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger"
                    aria-label="Sign out"
                  >
                    <IconLogout size={17} stroke={1.8} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}
      <main
        className={`w-full ${hideHeader || fullWidth ? "" : "mx-auto max-w-7xl px-4 py-6 md:px-6"}`}
      >
        {children}
      </main>
    </div>
  );
}
