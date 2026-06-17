"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { IconTrash, IconArrowLeft, IconUsers, IconSend, IconBell, IconHelp, IconMessage, IconCheck, IconEye } from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/time-ago";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationIcon } from "@/lib/notifications";

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

interface SupportTicketItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
  _count?: { messages: number };
  messages?: SupportMessageItem[];
}

interface SupportMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

const SUPPORT_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  OPEN: { label: "Open", classes: "border-warning/30 bg-warning/10 text-warning" },
  IN_PROGRESS: { label: "In Progress", classes: "border-accent/30 bg-accent/10 text-accent" },
  RESOLVED: { label: "Resolved", classes: "border-success/30 bg-success/10 text-success" },
  CLOSED: { label: "Closed", classes: "border-muted/30 bg-muted/10 text-muted" },
};

type Tab = "notifications" | "tickets" | "support" | "messages";



export default function AdminInboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("notifications");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
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
          { key: "tickets" as Tab, label: "Mentorship Tickets", icon: IconUsers },
          { key: "support" as Tab, label: "Support", icon: IconHelp },
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
      {tab === "support" && <SupportTab />}
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

function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<{ tickets: SupportTicketItem[] }>("/api/support/tickets");
      setTickets(data.tickets || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function openTicket(ticketId: string) {
    try {
      const data = await api.get<{ ticket: SupportTicketItem }>(`/api/support/tickets/${ticketId}`);
      setSelectedTicket(data.ticket);
    } catch {
      toast.error("Failed to load ticket");
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/api/support/tickets/${selectedTicket.id}/messages`, { message: replyText });
      setReplyText("");
      openTicket(selectedTicket.id);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  async function updateStatus(status: string) {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/support/tickets/${selectedTicket.id}/status`, { status });
      toast.success("Status updated");
      openTicket(selectedTicket.id);
      fetchTickets();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />;

  if (selectedTicket) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <button onClick={() => setSelectedTicket(null)} className="text-muted hover:text-foreground">
                <IconArrowLeft size={16} />
              </button>
              <p className="text-sm font-semibold text-foreground">Ticket Details</p>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-medium text-foreground">{selectedTicket.title}</p>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SUPPORT_STATUS_CONFIG[selectedTicket.status]?.classes || ""}`}>
                {SUPPORT_STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
              </span>
              <div className="text-xs text-muted space-y-1">
                <p>From: <span className="text-foreground font-medium">{selectedTicket.user.name}</span></p>
                <p>Role: <span className="text-foreground">{selectedTicket.user.role}</span></p>
                <p>Email: <span className="text-foreground">{selectedTicket.user.email}</span></p>
                <p>Created: {timeAgo(selectedTicket.createdAt)}</p>
              </div>
              <p className="text-sm text-muted-foreground border-t border-border pt-3">{selectedTicket.description}</p>

              {selectedTicket.status !== "CLOSED" && (
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.status !== "IN_PROGRESS" && (
                      <button onClick={() => updateStatus("IN_PROGRESS")} disabled={updatingStatus} className="btn-secondary text-xs">
                        Mark In Progress
                      </button>
                    )}
                    {selectedTicket.status !== "RESOLVED" && (
                      <button onClick={() => updateStatus("RESOLVED")} disabled={updatingStatus} className="btn-secondary text-xs">
                        Mark Resolved
                      </button>
                    )}
                    <button onClick={() => updateStatus("CLOSED")} disabled={updatingStatus} className="btn-secondary text-xs">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card flex flex-col">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Conversation ({selectedTicket.messages?.length || 0})</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
              <p className="text-center text-sm text-muted py-8">No messages yet.</p>
            ) : (
              selectedTicket.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender.role === "ADMIN" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                    msg.sender.role === "ADMIN"
                      ? "bg-primary text-white"
                      : "bg-card-hover text-foreground border border-border"
                  }`}>
                    <p className="text-[10px] font-medium mb-1 opacity-70">
                      {msg.sender.role === "ADMIN" ? "You" : msg.sender.name}
                    </p>
                    <p>{msg.message}</p>
                    <p className="text-[10px] mt-1 opacity-60">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {selectedTicket.status !== "CLOSED" && (
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Type your reply..."
                  className="field flex-1"
                />
                <button onClick={sendReply} disabled={!replyText.trim() || sendingReply} className="btn-primary text-sm flex items-center gap-1.5">
                  <IconSend size={14} /> Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <p className="font-semibold text-foreground">No support tickets</p>
        </div>
      ) : (
        tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => openTicket(t.id)}
            className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-left transition-colors hover:bg-card-hover"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
              {t.user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                <span className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${SUPPORT_STATUS_CONFIG[t.status]?.classes || ""}`}>
                  {SUPPORT_STATUS_CONFIG[t.status]?.label || t.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                From: {t.user.name} ({t.user.role}) &middot; {timeAgo(t.createdAt)}
              </p>
              {t._count && t._count.messages > 0 && (
                <p className="text-xs text-muted mt-0.5">{t._count.messages} message{t._count.messages > 1 ? "s" : ""}</p>
              )}
            </div>
          </button>
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
