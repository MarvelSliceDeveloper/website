"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconTrash, IconCheck, IconEye } from "@tabler/icons-react";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";

export default function AdminInboxPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your notifications.
        </p>
      </div>

      <NotificationsTab />
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
      setNotifications(data.notifications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function markAsRead(id: string) {
    await api.patch(`/api/notifications/${id}/read`, {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function deleteNotification(id: string) {
    await api.delete(`/api/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function markAllRead() {
    await api.post("/api/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card-hover border border-border" />)}</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "All read"}</p>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5">
            <IconCheck size={14} /> Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <p className="font-semibold text-foreground">No notifications</p>
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors ${
              n.read ? "border-border/60 bg-card/50" : "border-primary/20 bg-primary/5"
            }`}
          >
            <div className="mt-0.5"><NotificationIcon type={n.type} withContainer={false} /></div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                {n.message}
              </p>
              <p className="mt-1 text-[11px] text-muted">{timeAgo(n.createdAt)}</p>
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!n.read && (
                <button onClick={() => markAsRead(n.id)} className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-primary/10" title="Mark as read">
                  <IconEye size={15} />
                </button>
              )}
              <button onClick={() => deleteNotification(n.id)} className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10" title="Delete">
                <IconTrash size={15} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
