"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconTrash, IconCheck, IconBell, IconEye, IconInbox, IconFilter } from "@tabler/icons-react";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";
import StudentPortalShell from "@/components/StudentPortalShell";
import { toast, getErrorMessage } from "@/lib/toast";

export default function StudentInboxPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
      setNotifications(data.notifications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Load user profile for shell header
  useEffect(() => {
    api.get<{ user: { name: string; email: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          setStudentName(res.user.name || "Student");
          setStudentEmail(res.user.email || "");
        }
      })
      .catch(() => {});
  }, []);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function deleteNotification(id: string) {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function markAllRead() {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }

  async function clearRead() {
    try {
      await api.post("/api/notifications/clear-read");
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("Read notifications cleared");
    } catch {
      toast.error("Failed to clear");
    }
  }

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="sp-eyebrow">Student</p>
            <h1 className="mt-1.5 text-2xl font-bold text-foreground">Inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
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

        {/* Two-column: filters left, notifications right (on large screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Left sidebar: stats + filters */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">
            {/* Stats cards */}
            <div className="glass-card p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Overview</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">{notifications.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unread</span>
                <span className={`text-sm font-bold ${unreadCount > 0 ? "text-primary" : "text-foreground"}`}>{unreadCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Read</span>
                <span className="text-sm font-bold text-foreground">{notifications.length - unreadCount}</span>
              </div>
            </div>

            {/* Filter tabs (vertical on desktop) */}
            <div className="glass-card p-2 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted px-3 pt-2 pb-1">
                <IconFilter size={12} className="inline mr-1 -mt-0.5" />Filter
              </p>
              {(["all", "unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    filter === tab
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  }`}
                >
                  <span>{tab === "all" ? "All Notifications" : "Unread Only"}</span>
                  <span className={`text-xs ${filter === tab ? "text-primary" : "text-muted"}`}>
                    {tab === "all" ? notifications.length : unreadCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: notification list */}
          <div className="lg:col-span-9 xl:col-span-9">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-card-hover/60 border border-border/40" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                  {filter === "unread" ? <IconInbox size={32} /> : <IconBell size={32} />}
                </div>
                <p className="text-base font-semibold text-foreground">
                  {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
                  {filter === "unread"
                    ? "You've read all your notifications. Nice work!"
                    : "Notifications about sessions, enrollments, and grades will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${
                      n.read
                        ? "border-border/50 bg-card/40 hover:bg-card-hover/50"
                        : "border-primary/20 bg-primary/5 hover:bg-primary/8"
                    }`}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                          {n.message}
                        </p>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                        <span className="inline-flex items-center rounded-full border border-border/50 bg-card-hover/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                          {n.type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Mark as read"
                        >
                          <IconEye size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="rounded-lg p-2 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Delete"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentPortalShell>
  );
}
