"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import {
  IconTrash,
  IconCheck,
  IconBell,
  IconEye,
  IconInbox,
  IconFilter,
} from "@tabler/icons-react";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";
import StudentPortalShell from "@/components/StudentPortalShell";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";

export default function StudentInboxPage() {
  usePageTitle("Inbox");

  // Shared cached /api/auth/me query (same key as portal + settings).
  const meQuery = useApiQuery<{ user: { name: string; email: string } }>(
    ["auth", "me"],
    "/api/auth/me",
  );
  const studentName = meQuery.data?.user?.name || "Student";
  const studentEmail = meQuery.data?.user?.email || "";

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      breadcrumbs={[
        { label: "Student", onClick: () => window.history.back() },
        { label: "Inbox" },
      ]}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6">
        <div>
          <p className="sp-eyebrow">Student</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifications from instructors and admins.
          </p>
        </div>

        <NotificationsTab />
      </div>
    </StudentPortalShell>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notificationsQuery = useApiQuery<{
    notifications: NotificationItem[];
  }>(["notifications"], "/api/notifications");
  const notifications = notificationsQuery.data?.notifications ?? [];
  const loading = notificationsQuery.isPending;

  // Every mutation updates the cached list so the UI reacts instantly, then
  // invalidates to reconcile with the server.
  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ notifications: NotificationItem[] }>(
        ["notifications"],
        (old) => ({
          notifications: (old?.notifications ?? []).map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }),
      );
    },
    onError: () => toast.error("Failed to mark as read"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<{ notifications: NotificationItem[] }>(
        ["notifications"],
        (old) => ({
          notifications: (old?.notifications ?? []).filter((n) => n.id !== id),
        }),
      );
      toast.success("Notification removed");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post("/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.setQueryData<{ notifications: NotificationItem[] }>(
        ["notifications"],
        (old) => ({
          notifications: (old?.notifications ?? []).map((n) => ({
            ...n,
            read: true,
          })),
        }),
      );
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Failed to mark all as read"),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.post("/api/notifications/clear-read"),
    onSuccess: () => {
      queryClient.setQueryData<{ notifications: NotificationItem[] }>(
        ["notifications"],
        (old) => ({
          notifications: (old?.notifications ?? []).filter((n) => !n.read),
        }),
      );
      toast.success("Read notifications cleared");
    },
    onError: () => toast.error("Failed to clear"),
  });

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-3 xl:col-span-3 space-y-4">
        <div className="glass-card rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Overview
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Unread</span>
            <span
              className={`text-sm font-bold ${unreadCount > 0 ? "text-primary" : "text-foreground"}`}
            >
              {unreadCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Read</span>
            <span className="text-sm font-bold text-foreground">
              {notifications.length - unreadCount}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted px-3 pt-2 pb-1">
            <IconFilter size={12} className="inline mr-1 -mt-0.5" />
            Filter
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
              <span
                className={`text-xs ${filter === tab ? "text-primary" : "text-muted"}`}
              >
                {tab === "all" ? notifications.length : unreadCount}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <IconCheck size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={() => clearMutation.mutate()}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <IconTrash size={14} /> Clear read
          </button>
        </div>
      </div>

      <div className="lg:col-span-9 xl:col-span-9">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-card-hover/60 border border-border/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              {filter === "unread" ? (
                <IconInbox size={32} />
              ) : (
                <IconBell size={32} />
              )}
            </div>
            <p className="text-base font-semibold text-foreground">
              {filter === "unread"
                ? "You're all caught up!"
                : "No notifications yet"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
              {filter === "unread"
                ? "You've read all your notifications."
                : "Notifications about sessions, enrollments, and grades will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ${
                  n.read
                    ? "border-border/50 bg-card/40 hover:bg-card-hover/60 hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]"
                    : "border-primary/25 bg-primary/[0.04] hover:bg-primary/[0.07] hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]"
                }`}
              >
                {!n.read && (
                  <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />
                )}
                <div className="mt-0.5">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-[15px] font-bold ${n.read ? "text-foreground/80" : "text-foreground"}`}
                    >
                      {n.title || n.type.replace(/_/g, " ")}
                    </p>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p
                    className={`mt-1 text-sm leading-relaxed line-clamp-2 ${n.read ? "text-muted-foreground" : "text-foreground/90"}`}
                  >
                    {n.message}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-[11px] text-muted">
                      {timeAgo(n.createdAt)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-card-hover/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {n.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={() => readMutation.mutate(n.id)}
                      className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Mark as read"
                    >
                      <IconEye size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(n.id)}
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
  );
}
