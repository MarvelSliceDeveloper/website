"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  IconTrash,
  IconCheck,
  IconBell,
  IconEye,
  IconInbox,
  IconFilter,
  IconMessage,
} from "@tabler/icons-react";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";
import StudentPortalShell from "@/components/StudentPortalShell";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";

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

export default function StudentInboxPage() {
  usePageTitle("Inbox");
  const [tab, setTab] = useState<Tab>("notifications");
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    api
      .get<{ user: { name: string; email: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          setStudentName(res.user.name || "Student");
          setStudentEmail(res.user.email || "");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6">
        <div>
          <p className="sp-eyebrow">Student</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifications and messages from instructors and admins.
          </p>
        </div>

        <div className="flex gap-2 border-b border-border/50">
          {([
            { key: "notifications" as Tab, label: "Notifications", icon: IconBell },
            { key: "messages" as Tab, label: "Messages", icon: IconMessage },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-primary text-primary"
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
    </StudentPortalShell>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ notifications: NotificationItem[] }>("/api/notifications")
      .then((data) => {
        setNotifications(data.notifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
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

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-3 xl:col-span-3 space-y-4">
        <div className="glass-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Overview
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">{notifications.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Unread</span>
            <span className={`text-sm font-bold ${unreadCount > 0 ? "text-primary" : "text-foreground"}`}>
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

        <div className="glass-card p-2 space-y-1">
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
              <span className={`text-xs ${filter === tab ? "text-primary" : "text-muted"}`}>
                {tab === "all" ? notifications.length : unreadCount}
              </span>
            </button>
          ))}
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
                ? "You've read all your notifications."
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
                    : "border-primary/20 bg-primary/5 hover:bg-primary/12"
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
                    <button onClick={() => markAsRead(n.id)} className="rounded-lg p-2 text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Mark as read">
                      <IconEye size={15} />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} className="rounded-lg p-2 text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="Delete">
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

function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    api
      .get<{ conversations: Conversation[] }>("/api/messages/conversations")
      .then((data) => {
        setConversations(data.conversations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openThread = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const data = await api.get<{ messages: MessageRecord[] }>(`/api/messages/${userId}`);
      setThread(data.messages || []);
    } catch {
      setThread([]);
    }
  };

  const sendMessage = async () => {
    if (!selectedUserId || !newMessage.trim()) return;
    try {
      await api.post("/api/messages", {
        receiverId: selectedUserId,
        body: newMessage,
      });
      toast.success("Message sent");
      setNewMessage("");
      openThread(selectedUserId);
    } catch {
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Conversations</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No conversations yet</p>
          ) : (
            conversations.map((conv) => {
              const other = conv.sender.id === selectedUserId ? conv.receiver : conv.sender;
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
                    <p className="text-sm font-medium text-foreground truncate">{other.name}</p>
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
              {thread.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === selectedUserId ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                    msg.senderId === selectedUserId
                      ? "bg-card-hover text-foreground border border-border"
                      : "bg-primary text-white"
                  }`}>
                    <p>{msg.body}</p>
                    <p className="text-[10px] mt-1 opacity-60">{timeAgo(msg.createdAt)}</p>
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
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a reply..."
                  className="field flex-1"
                />
                <button onClick={sendMessage} disabled={!newMessage.trim()} className="btn-primary text-sm">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <IconMessage size={24} />
            </div>
            <p className="font-semibold text-foreground">Select a conversation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a conversation from the left to view and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
