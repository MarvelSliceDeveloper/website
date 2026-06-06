"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconBell,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightExpand,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { api } from "@/lib/api";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function Header({
  isSidebarCollapsed = false,
  onToggleSidebar = () => { },
}: {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await api.get<{ notifications: NotificationItem[]; unreadCount: number }>(
        "/api/notifications"
      );
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
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
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {isSidebarCollapsed ? (
              <IconLayoutSidebarRightExpand size={18} stroke={1.8} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.8} />
            )}
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">LMS Workspace</p>
            <h2 className="text-sm font-semibold text-foreground md:text-base">Welcome back 👋</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen((open) => !open);
                if (!notifOpen) loadNotifications();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
              aria-label="Notifications"
            >
              <IconBell size={18} stroke={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

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
                    <p className="px-4 py-6 text-center text-sm text-muted">No notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`border-b border-border/50 px-4 py-3 last:border-0 ${!item.read ? "bg-primary/5" : ""}`}
                      >
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                        <p className="mt-1 text-[11px] text-muted">{formatTime(item.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Settings"
          >
            <IconSettings size={18} stroke={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
