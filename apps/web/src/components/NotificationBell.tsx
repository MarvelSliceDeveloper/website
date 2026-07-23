"use client";

import { useEffect, useState, useCallback } from "react";
import { IconBell, IconCheck, IconTrash } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { useSocket, RealtimeNotification } from "@/lib/use-socket";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.allSettled([
        api.get<NotificationItem[]>("/api/notifications"),
        api.get<{ count: number }>("/api/notifications/unread-count"),
      ]);

      if (listRes.status === "fulfilled" && Array.isArray(listRes.value)) {
        setNotifications(listRes.value);
      }
      if (countRes.status === "fulfilled" && countRes.value?.count !== undefined) {
        setUnreadCount(countRes.value.count);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Hook into WebSocket real-time events
  useSocket(
    useCallback((newNotif: RealtimeNotification) => {
      const item: NotificationItem = {
        id: newNotif.id || `rt-${Date.now()}`,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        read: false,
        createdAt: newNotif.createdAt || new Date().toISOString(),
        metadata: newNotif.metadata,
      };

      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }, []),
  );

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card/80 text-foreground transition-all hover:bg-accent/15 hover:text-primary focus:outline-none"
        aria-label="Notifications"
      >
        <IconBell size={19} stroke={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 text-foreground"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Live Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <IconCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-center py-6 text-xs text-muted-foreground">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    n.read
                      ? "border-border/40 bg-card/40 opacity-75"
                      : "border-primary/20 bg-primary/5 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-muted-foreground hover:text-primary p-1"
                        title="Mark as read"
                      >
                        <IconCheck size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
