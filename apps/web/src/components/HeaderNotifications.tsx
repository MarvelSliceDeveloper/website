"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconArrowRight, IconEye, IconX } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import { NotificationIcon, type NotificationItem } from "@/lib/notifications";
import { useSocket, type RealtimeNotification } from "@/lib/use-socket";

/**
 * HeaderNotifications — the single notification bell + dropdown popup shared
 * by the admin/instructor `Header` and the `StudentPortalShell`, so every page
 * renders the exact same popup.
 */

interface HeaderNotificationsProps {
  /** Route the "View all notifications" footer link points at. */
  inboxHref: string;
  /** Subscribe to the realtime socket gateway (student portal uses this). */
  realtime?: boolean;
}

function RealtimeBridge({
  onNotification,
}: {
  onNotification: (n: RealtimeNotification) => void;
}) {
  useSocket(
    useCallback(
      (n: RealtimeNotification) => onNotification(n),
      [onNotification],
    ),
  );
  return null;
}

export default function HeaderNotifications({
  inboxHref,
  realtime = false,
}: HeaderNotificationsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    void loadNotifications();
    let interval = setInterval(loadNotifications, 120000);
    function handleVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        void loadNotifications();
        interval = setInterval(loadNotifications, 120000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRealtime = useCallback((n: RealtimeNotification) => {
    const item: NotificationItem = {
      id: n.id || `rt-${Date.now()}`,
      title: n.title,
      message: n.message,
      type: n.type,
      read: false,
      createdAt: n.createdAt || new Date().toISOString(),
    };
    setNotifications((prev) => [item, ...prev]);
    setUnreadCount((prev) => prev + 1);
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

  return (
    <div ref={containerRef} className="relative">
      {realtime && <RealtimeBridge onNotification={handleRealtime} />}

      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void loadNotifications();
        }}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-colors hover:bg-blue-500/15 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconBell size={17} stroke={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllRead()}
                  className="cursor-pointer text-[11px] text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer text-muted hover:text-foreground"
                aria-label="Close notifications"
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
                    <NotificationIcon type={n.type} withContainer={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {n.title || n.message}
                    </p>
                    {n.title && (
                      <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => void markOneRead(n.id)}
                      className="mt-0.5 shrink-0 cursor-pointer p-1 text-muted opacity-0 transition-colors group-hover:opacity-100 hover:text-primary"
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
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
              >
                View all notifications
                <IconArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
