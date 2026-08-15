"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IconArrowLeft, IconSend } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { timeAgo } from "@/lib/time-ago";
import { useApiQuery } from "@/lib/query";

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

const SUPPORT_STATUS_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  OPEN: {
    label: "Open",
    classes: "border-warning/30 bg-warning/10 text-warning",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "border-accent/30 bg-accent/10 text-accent",
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

export default function AdminInboxSupportPage() {
  usePageTitle("Support");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const ticketsQuery = useApiQuery<{ tickets: SupportTicketItem[] }>(
    ["admin", "support", "tickets"],
    "/api/support/tickets",
  );
  const tickets = ticketsQuery.data?.tickets ?? [];
  const loading = ticketsQuery.isPending;

  // Detail is a dependent query — enabled only once a ticket is selected.
  const selectedTicketQuery = useApiQuery<{ ticket: SupportTicketItem }>(
    ["admin", "support", "ticket", selectedTicketId ?? ""],
    selectedTicketId ? `/api/support/tickets/${selectedTicketId}` : "",
    undefined,
    { enabled: Boolean(selectedTicketId) },
  );
  const selectedTicket = selectedTicketQuery.data?.ticket ?? null;

  const openTicket = (ticketId: string) => setSelectedTicketId(ticketId);

  const sendReplyMutation = useMutation({
    mutationFn: (message: string) =>
      api.post(`/api/support/tickets/${selectedTicketId}/messages`, {
        message,
      }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyText("");
      void selectedTicketQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const sendReply = () => {
    if (!selectedTicketId || !replyText.trim()) return;
    sendReplyMutation.mutate(replyText);
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/support/tickets/${selectedTicketId}/status`, {
        status,
      }),
    onSuccess: () => {
      toast.success("Status updated");
      void selectedTicketQuery.refetch();
      void ticketsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const updateStatus = (status: string) => {
    if (!selectedTicketId) return;
    updateStatusMutation.mutate(status);
  };

  if (loading)
    return (
      <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />
    );

  if (selectedTicketId && selectedTicketQuery.isPending)
    return (
      <div className="h-40 animate-pulse rounded-xl bg-card-hover border border-border" />
    );

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Inbox
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage support tickets from users.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="text-muted hover:text-foreground"
                >
                  <IconArrowLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-foreground">
                  Ticket Details
                </p>
              </div>
              <div className="p-4 space-y-3">
                <p className="font-medium text-foreground">
                  {selectedTicket.title}
                </p>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${SUPPORT_STATUS_CONFIG[selectedTicket.status]?.classes || ""}`}
                >
                  {SUPPORT_STATUS_CONFIG[selectedTicket.status]?.label ||
                    selectedTicket.status}
                </span>
                <div className="text-xs text-muted space-y-1">
                  <p>
                    From:{" "}
                    <span className="text-foreground font-medium">
                      {selectedTicket.user.name}
                    </span>
                  </p>
                  <p>
                    Role:{" "}
                    <span className="text-foreground">
                      {selectedTicket.user.role}
                    </span>
                  </p>
                  <p>
                    Email:{" "}
                    <span className="text-foreground">
                      {selectedTicket.user.email}
                    </span>
                  </p>
                  <p>Created: {timeAgo(selectedTicket.createdAt)}</p>
                </div>
                <p className="text-sm text-muted-foreground border-t border-border pt-3">
                  {selectedTicket.description}
                </p>

                {selectedTicket.status !== "CLOSED" && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Update Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.status !== "IN_PROGRESS" && (
                        <button
                          onClick={() => updateStatus("IN_PROGRESS")}
                          disabled={updateStatusMutation.isPending}
                          className="btn-secondary text-xs"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {selectedTicket.status !== "RESOLVED" && (
                        <button
                          onClick={() => updateStatus("RESOLVED")}
                          disabled={updateStatusMutation.isPending}
                          className="btn-secondary text-xs"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus("CLOSED")}
                        disabled={updateStatusMutation.isPending}
                        className="btn-secondary text-xs"
                      >
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
              <p className="text-sm font-semibold text-foreground">
                Conversation ({selectedTicket.messages?.length || 0})
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
              {!selectedTicket.messages ||
              selectedTicket.messages.length === 0 ? (
                <p className="text-center text-sm text-muted py-8">
                  No messages yet.
                </p>
              ) : (
                selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender.role === "ADMIN" || msg.sender.role === "SUPER_ADMIN" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-xl px-4 py-2 text-sm ${
                        msg.sender.role === "ADMIN" ||
                        msg.sender.role === "SUPER_ADMIN"
                          ? "bg-primary text-white"
                          : "bg-card-hover text-foreground border border-border"
                      }`}
                    >
                      <p className="text-[10px] font-medium mb-1 opacity-70">
                        {msg.sender.role === "ADMIN" ||
                        msg.sender.role === "SUPER_ADMIN"
                          ? "You"
                          : msg.sender.name}
                      </p>
                      <p>{msg.message}</p>
                      <p className="text-[10px] mt-1 opacity-60">
                        {timeAgo(msg.createdAt)}
                      </p>
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
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sendReplyMutation.isPending}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    <IconSend size={14} /> Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Inbox
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage support tickets from users.
        </p>
      </div>

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
                  <p className="text-sm font-medium text-foreground">
                    {t.title}
                  </p>
                  <span
                    className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${SUPPORT_STATUS_CONFIG[t.status]?.classes || ""}`}
                  >
                    {SUPPORT_STATUS_CONFIG[t.status]?.label || t.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  From: {t.user.name} ({t.user.role}) &middot;{" "}
                  {timeAgo(t.createdAt)}
                </p>
                {t._count && t._count.messages > 0 && (
                  <p className="text-xs text-muted mt-0.5">
                    {t._count.messages} message
                    {t._count.messages > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
