"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconSettings,
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

// Top header bar with notifications, theme toggle, and settings
export default function Header({
  inboxHref = "/admin/inbox",
}: {
  inboxHref?: string;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
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
    const interval = setInterval(doFetch, 30000);
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

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  // Mark a single notification as read
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

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 h-12 md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Welcome back
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen((open) => !open);
                if (!notifOpen) loadNotifications();
              }}
              className="relative flex h-8 w-8 items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors"
              aria-label="Notifications"
            >
              <IconBell size={17} stroke={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-9 z-50 w-72 border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
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
                      aria-label="Close notifications"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-5 text-center text-sm text-muted">
                      No notifications
                    </p>
                  ) : (
                    notifications.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className={`group flex items-start gap-2 border-b border-border/50 px-3 py-2.5 last:border-0 ${!item.read ? "bg-primary/[0.03]" : ""}`}
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
                  <div className="border-t border-border px-3 py-2">
                    <button
                      onClick={() => {
                        router.push(inboxHref);
                        setNotifOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      View all notifications
                      <IconArrowLeft size={12} className="rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() =>
              router.push(inboxHref.replace("/inbox", "/settings"))
            }
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            aria-label="Settings"
          >
            <IconSettings size={17} stroke={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
