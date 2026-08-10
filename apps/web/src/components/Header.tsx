"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconBell,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconX,
  IconEye,
  IconArrowLeft,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

interface HeaderProps {
  inboxHref?: string;
  userName?: string;
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Header({
  inboxHref = "/admin/inbox",
  userName = "",
  userEmail = "",
  collapsed = false,
  onToggleCollapse,
}: HeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const settingsHref = inboxHref.replace("/inbox", "/settings");

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.get<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const doFetch = () => {
      api
        .get<{ notifications: NotificationItem[]; unreadCount: number }>(
          "/api/notifications",
        )
        .then((data) => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };

    doFetch();
    const interval = setInterval(doFetch, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const handleSignOut = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-muted/40 shadow-sm">
      <div className="mx-auto flex max-w-full items-center gap-4 px-4 h-14 md:px-6">
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/15 transition-colors rounded-lg"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconMenu2 size={18} stroke={1.8} />
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => {
            const base = inboxHref.startsWith("/instructor")
              ? "/instructor/dashboard"
              : "/admin/dashboard";
            router.push(base);
          }}
        >
          <Image
            src="/images/logo.svg"
            alt="Marvel Slice"
            width={36}
            height={36}
            className="h-9 w-auto object-contain"
          />
          <span className="text-base font-extrabold tracking-tight text-foreground hidden sm:inline">
            <span>Marvel</span>
            <span className="text-primary ml-0.5">Slice</span>
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {userEmail && (
            <>
              <span
                className="hidden max-w-[200px] truncate text-[13px] text-muted-foreground sm:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
              <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            </>
          )}

          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen((open) => !open);
                if (!notifOpen) loadNotifications();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-slate transition-colors hover:bg-hairline hover:text-ink"
              aria-label="Notifications"
            >
              <IconBell size={17} stroke={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
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
                    notifications.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={`group flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0 ${!item.read ? "bg-primary/5" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {item.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                        {!item.read && (
                          <button
                            onClick={() => markOneRead(item.id)}
                            className="mt-0.5 shrink-0 p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-primary transition-colors"
                            title="Mark as read"
                          >
                            <IconEye size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="border-t border-border px-4 py-2.5">
                    <button
                      onClick={() => {
                        router.push(inboxHref);
                        setNotifOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      View all notifications
                      <IconArrowLeft size={13} className="rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push(settingsHref)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-slate transition-colors hover:bg-hairline hover:text-ink"
            aria-label="Settings"
          >
            <IconSettings size={17} stroke={1.8} />
          </button>

          <button
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-slate transition-colors hover:bg-danger-tint hover:text-danger"
            aria-label="Sign out"
          >
            <IconLogout size={17} stroke={1.8} />
          </button>

        </div>
      </div>
    </header>
  );
}
