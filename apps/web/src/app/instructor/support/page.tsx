"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/Skeleton";
import {
  IconHelp,
  IconArrowLeft,
  IconSend,
  IconPlus,
  IconMessage,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

interface TicketUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: TicketUser;
  _count?: { messages: number };
  messages?: SupportMessage[];
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  OPEN: { label: "Open", classes: "border-warning/30 bg-warning/10 text-warning" },
  IN_PROGRESS: { label: "In Progress", classes: "border-accent/30 bg-accent/10 text-accent" },
  RESOLVED: { label: "Resolved", classes: "border-success/30 bg-success/10 text-success" },
  CLOSED: { label: "Closed", classes: "border-muted/30 bg-muted/10 text-muted" },
};

export default function InstructorSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<{ tickets: SupportTicket[] }>("/api/tickets?type=SUPPORT");
      setTickets(data.tickets || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function openTicket(ticketId: string) {
    try {
      const data = await api.get<{ ticket: SupportTicket }>(`/api/tickets/${ticketId}`);
      setSelectedTicket(data.ticket);
    } catch {
      toast.error("Failed to load ticket");
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/api/tickets", { type: "SUPPORT", title: newTitle, description: newDescription });
      toast.success("Support ticket created");
      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      fetchTickets();
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/api/tickets/${selectedTicket.id}/messages`, { message: replyText });
      setReplyText("");
      openTicket(selectedTicket.id);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  if (selectedTicket) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/instructor" className="btn-secondary text-xs inline-flex items-center gap-1.5 w-fit">
          <IconArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Instructor</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{selectedTicket.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={selectedTicket.status} config={STATUS_CONFIG} />
              <span className="text-xs text-muted">{timeAgo(selectedTicket.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground border-l-2 border-border pl-4">{selectedTicket.description}</p>

        <div className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">
              Conversation {selectedTicket.messages?.length ? `(${selectedTicket.messages.length})` : ""}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-3 p-5">
            {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
              <p className="text-center text-sm text-muted py-10">No messages yet. Admin will respond shortly.</p>
            ) : (
              selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender.role === "ADMIN" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-lg rounded-xl px-4 py-2.5 text-sm ${
                    msg.sender.role === "ADMIN"
                      ? "bg-card-hover text-foreground border border-border"
                      : "bg-primary text-white"
                  }`}>
                    <p className="text-[10px] font-semibold mb-1 opacity-70 uppercase tracking-wider">
                      {msg.sender.role === "ADMIN" ? "Admin" : "You"}
                    </p>
                    <p className="leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] mt-1.5 opacity-60">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {selectedTicket.status !== "CLOSED" && (
            <div className="border-t border-border p-5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
                  placeholder="Type your reply..."
                  className="field flex-1"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
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
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/instructor" className="btn-secondary text-xs inline-flex items-center gap-1.5 w-fit">
        <IconArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Instructor</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report issues or ask questions. Admin will review and respond.
          </p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="btn-primary">
          {showCreate ? "Cancel" : "New Ticket"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createTicket} className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <p className="font-semibold text-foreground">Create Support Ticket</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              className="field w-full"
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="field w-full resize-none"
              required
              minLength={10}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Skeleton lines={4} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<IconHelp size={28} />}
          title="No support tickets"
          description="Create a ticket and admin will help you out."
        />
      ) : (
        <div className="space-y-2.5">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => openTicket(t.id)}
              className="w-full flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:bg-card-hover hover:border-border"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0 mt-0.5">
                <IconHelp size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                  <StatusBadge status={t.status} config={STATUS_CONFIG} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted">
                  <span>{timeAgo(t.createdAt)}</span>
                  {t._count && (
                    <span className="flex items-center gap-1">
                      <IconMessage size={12} /> {t._count.messages} {t._count.messages === 1 ? "message" : "messages"}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
