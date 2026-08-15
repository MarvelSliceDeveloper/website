"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import {
  IconTrash,
  IconBell,
  IconCheck,
  IconEye,
  IconMessage,
} from "@tabler/icons-react";
import { toast } from "@/lib/toast";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface MessageRecord {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  sender: { id: string; name: string; role: string };
  receiver: { id: string; name: string; role: string };
  subject: string | null;
  body: string;
  read: boolean;
  createdAt: string;
}

type Tab = "notifications" | "messages";

export default function InstructorInboxPage() {
  usePageTitle("Inbox");
  const [tab, setTab] = useState<Tab>("notifications");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inbox"
        breadcrumbs={[{ label: "Inbox", href: "/instructor/inbox" }]}
        role="Instructor"
        description="Notifications and messages with admins and students."
      />

      <div className="flex gap-2 border-b border-border/50">
        {[
          {
            key: "notifications" as Tab,
            label: "Notifications",
            icon: IconBell,
          },
          { key: "messages" as Tab, label: "Messages", icon: IconMessage },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "notifications" && <NotificationsTab />}
      {tab === "messages" && <MessagesTab />}
    </div>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();

  // Shares the ["notifications"] cache with the student inbox (and any header
  // unread badge that polls the same endpoint).
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
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <IconCheck size={14} /> Mark all read
          </button>
        )}
      </div>
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
                <p className={`text-[15px] font-bold ${n.read ? "text-foreground/80" : "text-foreground"}`}>
                  {n.title || n.type.replace(/_/g, " ")}
                </p>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />}
              </div>
              <p className={`mt-1 text-sm leading-relaxed line-clamp-2 ${n.read ? "text-muted-foreground" : "text-foreground/90"}`}>
                {n.message}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
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

function MessagesTab() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Shares the ["messages","conversations"] cache with the student inbox.
  const conversationsQuery = useApiQuery<{ conversations: Conversation[] }>(
    ["messages", "conversations"],
    "/api/messages/conversations",
  );
  const conversations = conversationsQuery.data?.conversations ?? [];
  const loading = conversationsQuery.isPending;

  // Thread is a dependent query — enabled only once a conversation is selected.
  const threadQuery = useApiQuery<{ messages: MessageRecord[] }>(
    ["messages", "thread", selectedUserId ?? ""],
    selectedUserId ? `/api/messages/${selectedUserId}` : "",
    undefined,
    { enabled: Boolean(selectedUserId) },
  );
  const thread = threadQuery.data?.messages ?? [];

  const sendMutation = useMutation({
    mutationFn: ({
      receiverId,
      body,
    }: {
      receiverId: string;
      body: string;
    }) => api.post("/api/messages", { receiverId, body }),
    onSuccess: (_, { receiverId }) => {
      toast.success("Message sent");
      setNewMessage("");
      void queryClient.invalidateQueries({
        queryKey: ["messages", "thread", receiverId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    },
    onError: () => toast.error("Failed to send message"),
  });

  const openThread = (userId: string) => setSelectedUserId(userId);

  const sendMessage = () => {
    if (!selectedUserId || !newMessage.trim()) return;
    sendMutation.mutate({ receiverId: selectedUserId, body: newMessage });
  };

  if (loading)
    return (
      <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />
    );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Conversations</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => {
              const other =
                conv.sender.id === selectedUserId ? conv.receiver : conv.sender;
              return (
                <button
                  key={conv.id}
                  onClick={() => openThread(other.id)}
                  className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-card-hover ${
                    selectedUserId === other.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                    {other.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {other.name}
                    </p>
                    <p className="text-xs text-muted truncate">{conv.body}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card lg:col-span-2 flex flex-col">
        {selectedUserId ? (
          <>
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {thread.map((msg: MessageRecord) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === selectedUserId ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                      msg.senderId === selectedUserId
                        ? "bg-card-hover text-foreground border border-border"
                        : "bg-primary text-white"
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className="text-[10px] mt-1 opacity-60">
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !sendMutation.isPending && sendMessage()
                  }
                  placeholder="Type a message..."
                  disabled={sendMutation.isPending}
                  className="field flex-1"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="btn-primary text-sm"
                >
                  {sendMutation.isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <IconMessage size={24} />
            </div>
            <p className="font-semibold text-foreground">
              Select a conversation
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a conversation from the left to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
