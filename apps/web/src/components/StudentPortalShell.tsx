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
  IconChevronDown,
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
}: StudentPortalShellProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

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
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setAvatarOpen(false);
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

  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && (
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
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
                <span className="hidden sm:inline">Back</span>
              </button>

              {!hideLogo && (
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    className="h-9 w-auto object-contain"
                  />
                  <span className="text-base font-bold text-foreground">
                    Marvel Slice
                  </span>
                </div>
              )}

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
              <button
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
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
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setAvatarOpen(false);
                  }}
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
                <div ref={avatarRef} className="relative">
                  <button
                    id="sp-avatar-btn"
                    onClick={() => {
                      setAvatarOpen((v) => !v);
                      setNotifOpen(false);
                    }}
                    className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-hover"
                    aria-label="User menu"
                    aria-haspopup="true"
                    aria-expanded={avatarOpen}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-primary to-violet-600 text-[11px] font-bold text-white">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline">{studentName}</span>
                    <IconChevronDown size={13} className="text-muted" />
                  </button>

                  {avatarOpen && (
                    <div className="absolute right-0 top-11 z-50 w-44 rounded-2xl border border-border bg-card shadow-2xl">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                          {studentName}
                        </p>
                        <p className="text-[11px] text-muted">{studentEmail}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          id="sp-avatar-settings"
                          onClick={() => router.push("/student/settings")}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                        >
                          <IconSettings size={15} stroke={1.8} />
                          Settings
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button
                          id="sp-avatar-signout"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                        >
                          <IconLogout size={15} stroke={1.8} />
                          Sign Out
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
        className={`w-full ${hideHeader ? "" : "mx-auto max-w-7xl px-4 py-6 md:px-6"}`}
      >
        {children}
      </main>
    </div>
  );
}
