"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconBell, IconEye, IconTrash, IconCheck, IconArrowLeft, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  SESSION_SCHEDULED: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary"><IconBell size={16} /></div>,
  SESSION_CANCELLED: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/20 text-danger"><IconX size={16} /></div>,
  RECORDING_AVAILABLE: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent"><IconEye size={16} /></div>,
  ENROLLMENT_APPROVED: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-success"><IconCheck size={16} /></div>,
  ENROLLMENT_REJECTED: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/20 text-danger"><IconX size={16} /></div>,
  ASSIGNMENT_GRADED: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary"><IconBell size={16} /></div>,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function StudentInboxPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
      setNotifications(data.notifications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

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

  async function clearRead() {
    await api.post("/api/notifications/clear-read");
    setNotifications((prev) => prev.filter((n) => !n.read));
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1"
          >
            <IconArrowLeft size={14} /> Back
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5">
              <IconCheck size={14} /> Mark all read
            </button>
          )}
          <button onClick={clearRead} className="btn-secondary text-xs flex items-center gap-1.5">
            <IconTrash size={14} /> Clear read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab
                ? "border-primary/30 bg-primary/20 text-primary-hover"
                : "border-border bg-card text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {tab === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card-hover border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <IconBell size={28} />
          </div>
          <p className="font-semibold text-foreground">No notifications</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "unread" ? "You've read everything!" : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                n.read
                  ? "border-border/60 bg-card/50"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              {NOTIF_ICONS[n.type] || <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card-hover text-muted"><IconBell size={16} /></div>}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {n.message}
                  </p>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted">{n.type.replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Mark as read"
                  >
                    <IconEye size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="rounded-lg p-2 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Delete"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
