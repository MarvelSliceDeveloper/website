"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/Skeleton";
import StudentPortalShell from "@/components/StudentPortalShell";
import {
  IconHelp,
  IconSend,
  IconMessage,
  IconX,
  IconPlus,
  IconLifebuoy,
  IconMessageCircle,
  IconClock,
  IconCheck,
  IconTicket,
} from "@tabler/icons-react";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";

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
  _count?: { messages: number };
  messages?: SupportMessage[];
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  OPEN: {
    label: "Open",
    classes: "border-warning/30 bg-warning/10 text-warning",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "border-brand-blue/20 bg-brand-blue-tint text-brand-blue",
  },
  RESOLVED: {
    label: "Resolved",
    classes: "border-success/30 bg-success/10 text-success",
  },
  CLOSED: {
    label: "Closed",
    classes: "border-muted/30 bg-muted/10 text-muted",
  },
};

export default function StudentSupportPage() {
  usePageTitle("Support");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get<{ tickets: SupportTicket[] }>(
        "/api/tickets?type=SUPPORT",
      );
      setTickets(data.tickets || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .get<{ tickets: SupportTicket[] }>("/api/tickets?type=SUPPORT")
      .then((data) => {
        setTickets(data.tickets || []);
      })
      .catch(() => { })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Load user profile for shell header
  useEffect(() => {
    api
      .get<{ user: { name: string; email: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          setStudentName(res.user.name || "Student");
          setStudentEmail(res.user.email || "");
        }
      })
      .catch(() => { });
  }, []);

  async function openTicket(ticketId: string) {
    const promise = api.get<{ ticket: SupportTicket }>(
      `/api/tickets/${ticketId}`,
    );
    toast.promise(promise, {
      loading: "Opening ticket...",
      success: undefined,
      error: "Failed to load ticket",
    });
    try {
      const data = await promise;
      setSelectedTicket(data.ticket);
    } catch {
      /* handled by toast */
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSubmitting(true);
    const promise = api.post("/api/tickets", {
      type: "SUPPORT",
      title: newTitle,
      description: newDescription,
    });
    toast.promise(promise, {
      loading: "Creating ticket...",
      success: "Support ticket created",
      error: "Failed to create ticket",
    });
    try {
      await promise;
      setShowForm(false);
      setNewTitle("");
      setNewDescription("");
      fetchTickets();
    } catch {
      /* handled by toast */
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    const promise = api.post(`/api/tickets/${selectedTicket.id}/messages`, {
      message: replyText,
    });
    toast.promise(promise, {
      loading: "Sending reply...",
      success: "Reply sent",
      error: "Failed to send reply",
    });
    try {
      await promise;
      setReplyText("");
      openTicket(selectedTicket.id);
    } catch {
      /* handled by toast */
    } finally {
      setSendingReply(false);
    }
  }

  // ── Ticket detail panel (right side on desktop) ──────────────────────

  function renderTicketDetail() {
    if (!selectedTicket) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Ticket header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border/60">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <StatusBadge
                status={selectedTicket.status}
                config={STATUS_CONFIG}
              />
              <span className="text-[11px] text-muted">
                {timeAgo(selectedTicket.createdAt)}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground leading-snug">
              {selectedTicket.title}
            </h2>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border-hover transition-colors shrink-0"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Original description */}
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
            Description
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedTicket.description}
          </p>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!selectedTicket.messages || selectedTicket.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/10">
                <IconMessageCircle size={24} className="text-muted" />
              </div>
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted">Admin will respond shortly.</p>
            </div>
          ) : (
            selectedTicket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender.role === "ADMIN" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender.role === "ADMIN"
                    ? "bg-card-hover text-foreground border border-border/60 rounded-tl-md"
                    : "bg-primary text-white rounded-tr-md"
                    }`}
                >
                  <p className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-wider">
                    {msg.sender.role === "ADMIN" ? "Admin" : "You"}
                  </p>
                  <p className="leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] mt-1.5 opacity-50">
                    {timeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply input */}
        {selectedTicket.status !== "CLOSED" && (
          <div className="border-t border-border/60 p-4">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), sendReply())
                }
                placeholder="Type your reply..."
                className="field flex-1"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sendingReply}
                className="btn-primary text-sm flex items-center gap-1.5 shrink-0"
              >
                <IconSend size={14} /> Send
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── New ticket form (right side on desktop) ──────────────────────────

  function renderNewTicketForm() {
    return (
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Create Support Ticket
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Describe your issue and we&#39;ll get back to you.
          </p>
        </div>
        <form onSubmit={createTicket} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Title
            </label>
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
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={6}
              className="field w-full resize-none"
              required
              minLength={10}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Empty right panel placeholder ────────────────────────────────────

  function renderEmptyDetail() {
    return (
      <div className="flex flex-col items-center justify-center h-99 w-224 text-center gap-4 px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <IconLifebuoy size={32} className="text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">
            Select a ticket
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a ticket from the list to view the conversation, or create a
            new one.
          </p>
        </div>
      </div>
    );
  }

  // ── Ticket list card ─────────────────────────────────────────────────

  function renderTicketCard(t: SupportTicket) {
    const isActive = selectedTicket?.id === t.id;

    return (
      <button
        key={t.id}
        onClick={() => {
          openTicket(t.id);
          setShowForm(false);
        }}
        className={`w-full flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${isActive
          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
          : "border-border/60 bg-card hover:bg-card-hover hover:border-border"
          }`}
      >
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5 ${isActive
            ? "bg-primary/20 text-primary"
            : "bg-primary/10 text-primary"
            }`}
        >
          <IconHelp size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-foreground truncate">
              {t.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {t.description}
          </p>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <StatusBadge status={t.status} config={STATUS_CONFIG} />
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <IconClock size={11} /> {timeAgo(t.createdAt)}
            </span>
            {t._count && (
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <IconMessage size={11} /> {t._count.messages}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────

  const openCount = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const totalMessages = tickets.reduce(
    (s, t) => s + (t._count?.messages ?? 0),
    0,
  );

  const BORDER_CLASSES: Record<string, string> = {
    OPEN: "border-l-warning/40",
    IN_PROGRESS: "border-l-accent/40",
    RESOLVED: "border-l-success/40",
    CLOSED: "border-l-muted/20",
  };

  const STAT_ICONS: Record<string, { bg: string; text: string }> = {
    open: { bg: "bg-warning/15", text: "text-warning" },
    resolved: { bg: "bg-success/15", text: "text-success" },
    total: { bg: "bg-brand-blue-tint", text: "text-brand-blue" },
    messages: { bg: "bg-primary/15", text: "text-primary" },
  };

  return (
    <StudentPortalShell
      studentName={studentName}
      studentEmail={studentEmail}
      showBack
      onBack={() => window.history.back()}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Page header */}
        <div>
          <p className="sp-eyebrow">Student</p>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report issues or ask questions about login, courses, or anything
            else.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Open Tickets",
              value: openCount,
              icon: IconHelp,
              key: "open",
            },
            {
              label: "Resolved",
              value: resolvedCount,
              icon: IconCheck,
              key: "resolved",
            },
            {
              label: "Total Tickets",
              value: tickets.length,
              icon: IconTicket,
              key: "total",
            },
            {
              label: "Messages",
              value: totalMessages,
              icon: IconMessage,
              key: "messages",
            },
          ].map((stat) => {
            const s = STAT_ICONS[stat.key];
            return (
              <div
                key={stat.key}
                className="glass-card p-3.5 group hover:-translate-y-0.5 transition-all cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      {stat.label}
                    </p>
                    <p className={`text-xl font-black ${s.text}`}>
                      {loading ? "\u2014" : stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.text} group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon size={16} stroke={1.8} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop two-column layout */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          style={{ minHeight: "calc(100vh - 260px)" }}
        >
          {/* Left: ticket list */}
          <div
            className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-3 ${selectedTicket && !showForm ? "hidden lg:flex" : "flex"}`}
          >
            {/* New ticket button */}
            <button
              onClick={() => {
                setShowForm((v) => !v);
                setSelectedTicket(null);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <IconPlus size={16} />
              {showForm ? "Cancel" : "New Ticket"}
            </button>

            {/* Ticket list */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton lines={3} />
                <Skeleton lines={3} />
                <Skeleton lines={3} />
              </div>
            ) : tickets.length === 0 ? (
              <div className="glass-card flex flex-col items-center gap-3 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <IconHelp size={28} />
                </div>
                <p className="font-semibold text-foreground">
                  No support tickets
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Create a ticket and admin will help you out.
                </p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setSelectedTicket(null);
                  }}
                  className="btn-primary text-sm mt-1"
                >
                  Create Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      openTicket(t.id);
                      setShowForm(false);
                    }}
                    className={`w-full text-left rounded-xl border-l-4 p-4 transition-all hover:-translate-y-0.5 ${BORDER_CLASSES[t.status] || "border-l-muted/20"
                      } ${selectedTicket?.id === t.id
                        ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
                        : "border-border/60 bg-card hover:bg-card-hover hover:border-border"
                      }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5 ${selectedTicket?.id === t.id
                          ? "bg-primary/20 text-primary"
                          : "bg-primary/10 text-primary"
                          }`}
                      >
                        <IconHelp size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {t.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {t.description}
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <StatusBadge
                            status={t.status}
                            config={STATUS_CONFIG}
                          />
                          <span className="flex items-center gap-1 text-[11px] text-muted">
                            <IconClock size={11} /> {timeAgo(t.createdAt)}
                          </span>
                          {t._count && (
                            <span className="flex items-center gap-1 text-[11px] text-muted">
                              <IconMessage size={11} /> {t._count.messages}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: detail / form / empty */}
          <div
            className={`lg:col-span-7 xl:col-span-8 glass-card overflow-hidden lg:sticky lg:top-24 ${selectedTicket || showForm ? "flex" : "hidden lg:flex"}`}
            style={{ minHeight: "520px", maxHeight: "calc(100vh - 180px)" }}
          >
            <div className="flex flex-col w-full h-full">
              {/* Mobile back button */}
              {(selectedTicket || showForm) && (
                <div className="lg:hidden border-b border-border/60 px-4 py-2.5">
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setShowForm(false);
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    ← Back to tickets
                  </button>
                </div>
              )}

              {showForm
                ? renderNewTicketForm()
                : selectedTicket
                  ? renderTicketDetail()
                  : renderEmptyDetail()}
            </div>
          </div>
        </div>
      </div>
    </StudentPortalShell>
  );
}
