"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IconTrash, IconCheck, IconEye, IconSend } from "@tabler/icons-react";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { usePageTitle } from "@/lib/use-page-title";
import { NotificationIcon } from "@/lib/notifications";
import { useApiQuery } from "@/lib/query";
import { toast } from "@/lib/toast";

type SentNotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetType: string;
  channel: "IN_APP" | "EMAIL" | "BOTH";
  recipientCount: number;
  createdAt: string;
};

const CHANNEL_LABEL: Record<SentNotificationItem["channel"], string> = {
  IN_APP: "In-app",
  EMAIL: "Email",
  BOTH: "In-app + email",
};

export default function AdminInboxPage() {
  usePageTitle("Inbox");
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your inbox and notifications you&apos;ve sent.
        </p>
      </div>

      <SentTab />
      <NotificationsTab />
    </div>
  );
}

function SentTab() {
  const sentQuery = useApiQuery<{ sent: SentNotificationItem[] }>(
    ["notifications", "sent"],
    "/api/notifications/sent",
  );
  const sent = sentQuery.data?.sent ?? [];
  const loading = sentQuery.isPending;

  if (loading) {
    return (
      <div>
        <SectionTitle title="Sent" count={undefined} />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-card-hover/60 border border-border/40"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle title="Sent" count={sent.length} />
      {sent.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-8 text-center">
          <p className="font-semibold text-foreground">
            No notifications sent yet
          </p>
          <p className="mt-1 text-xs text-muted">
            Send a notification to reach your users.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sent.map((n) => (
            <div
              key={n.id}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-colors"
            >
              <div className="mt-0.5">
                <NotificationIcon
                  type={n.type || "CUSTOM_NOTIFICATION"}
                  withContainer={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {n.title}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary-hover">
                    <IconSend size={10} />
                    {CHANNEL_LABEL[n.channel] ?? n.channel}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  {n.message}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {timeAgo(n.createdAt)} · {n.recipientCount} recipient
                  {n.recipientCount !== 1 ? "s" : ""} ·{" "}
                  {n.targetType.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();

  // Shares the ["notifications"] cache with the instructor/student inboxes.
  const notificationsQuery = useApiQuery<{
    notifications: NotificationItem[];
  }>(["notifications"], "/api/notifications");
  const notifications = notificationsQuery.data?.notifications ?? [];
  const loading = notificationsQuery.isPending;

  // Optimistic cache updates so the list reacts instantly, without a refetch
  // per action.
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
    },
    onError: () => toast.error("Failed to mark all as read"),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-card-hover/60 border border-border/40"
          />
        ))}
      </div>
    );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Inbox
          </h2>
          {notifications.length > 0 && (
            <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {notifications.length}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <IconCheck size={14} /> Mark all read
          </button>
        )}
      </div>
      {unreadCount > 0 && (
        <p className="mb-2 text-sm text-muted-foreground">
          {unreadCount} unread
        </p>
      )}
      {notifications.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 text-center">
          <p className="font-semibold text-foreground">No notifications</p>
        </div>
      ) : (
        notifications.map((n) => (
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
                  className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10"
                  title="Mark as read"
                >
                  <IconEye size={15} />
                </button>
              )}
              <button
                onClick={() => deleteMutation.mutate(n.id)}
                className="rounded-lg p-2 text-muted hover:text-danger hover:bg-danger/10"
                title="Delete"
              >
                <IconTrash size={15} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
