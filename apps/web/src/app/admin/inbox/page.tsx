"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconBell, IconEye, IconTrash, IconCheck, IconArrowLeft, IconX, IconUsers, IconMessage } from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  student: { id: string; name: string; email: string };
  mentor?: { id: string; name: string };
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

type Tab = "notifications" | "tickets" | "messages";

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

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  SESSION_SCHEDULED: <IconBell size={16} className="text-primary" />,
  SESSION_CANCELLED: <IconX size={16} className="text-danger" />,
  RECORDING_AVAILABLE: <IconEye size={16} className="text-accent" />,
  ENROLLMENT_APPROVED: <IconCheck size={16} className="text-success" />,
  ENROLLMENT_REJECTED: <IconX size={16} className="text-danger" />,
};

export default function AdminInboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("notifications");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 inline-flex items-center gap-1"
        >
          <IconArrowLeft size={14} /> Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage notifications, support tickets, and messages with instructors.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/50">
        {[
          { key: "notifications" as Tab, label: "Notifications", icon: IconBell },
          { key: "tickets" as Tab, label: "Support Tickets", icon: IconUsers },
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
      {tab === "tickets" && <TicketsTab />}
      {tab === "messages" && <MessagesTab />}
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
            <div className="mt-0.5">{NOTIF_ICONS[n.type] || <IconBell size={16} className="text-muted" />}</div>
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

function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ tickets?: Ticket[] }>("/api/mentorship/tickets")
      .then((data) => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-card-hover border border-border" />)}</div>;

  return (
    <div className="space-y-2">
      {tickets.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <p className="font-semibold text-foreground">No support tickets</p>
        </div>
      ) : (
        tickets.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              {t.student.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  t.status === "OPEN" ? "border-warning/20 bg-warning/10 text-warning" :
                  t.status === "ASSIGNED" ? "border-primary/20 bg-primary/10 text-primary-hover" :
                  t.status === "SCHEDULED" ? "border-accent/20 bg-accent/10 text-accent" :
                  t.status === "COMPLETED" ? "border-success/20 bg-success/10 text-success" :
                  "border-muted/20 bg-muted/10 text-muted"
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">From: {t.student.name} &middot; {timeAgo(t.createdAt)}</p>
              {t.mentor && <p className="text-xs text-muted mt-0.5">Mentor: {t.mentor.name}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.get<{ conversations: Conversation[] }>("/api/messages/conversations");
      setConversations(data.conversations || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const openThread = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const data = await api.get<{ messages: any[] }>(`/api/messages/${userId}`);
      setThread(data.messages || []);
    } catch { setThread([]); }
  };

  const sendMessage = async () => {
    if (!selectedUserId || !newMessage.trim()) return;
    try {
      await api.post("/api/messages", { receiverId: selectedUserId, body: newMessage });
      toast.success("Message sent");
      setNewMessage("");
      openThread(selectedUserId);
    } catch { toast.error("Failed to send message"); }
  };

  const getOtherUser = (conv: Conversation) => {
    return conv.sender.id === selectedUserId ? conv.receiver : conv.sender;
  };

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Conversation List */}
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

      {/* Message Thread */}
      <div className="rounded-xl border border-border/60 bg-card lg:col-span-2 flex flex-col">
        {selectedUserId ? (
          <>
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {thread.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === selectedUserId ? "justify-start" : "justify-end"}`}
                >
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
                  placeholder="Type a message..."
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
            <p className="mt-1 text-sm text-muted-foreground">Choose a conversation from the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
