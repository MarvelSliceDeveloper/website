"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import type { SupportTicket } from "./constants";
import { STATUS_CONFIG } from "./constants";

interface SupportTicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export default function SupportTicketDetail({ ticketId, onBack }: SupportTicketDetailProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await api.get<{ ticket: SupportTicket }>(`/api/tickets/${ticketId}`);
        if (!cancelled) setTicket(data.ticket);
      } catch {
        if (!cancelled) toast.error("Failed to load ticket");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [ticketId]);

  async function sendReply() {
    if (!ticket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/api/tickets/${ticket.id}/messages`, { message: replyText });
      setReplyText("");
      const data = await api.get<{ ticket: SupportTicket }>(`/api/tickets/${ticketId}`);
      setTicket(data.ticket);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-card-hover" />
        <div className="h-6 w-64 animate-pulse rounded-lg bg-card-hover" />
        <div className="h-4 w-48 animate-pulse rounded-lg bg-card-hover" />
        <div className="h-64 animate-pulse rounded-xl bg-card-hover" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">Ticket not found.</p>
        <button onClick={onBack} className="btn-secondary mt-4 text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={onBack}
        className="btn-secondary text-xs inline-flex items-center gap-1.5 w-fit"
      >
        <IconArrowLeft size={14} /> Back to Tickets
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Instructor</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{ticket.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={ticket.status} config={STATUS_CONFIG} />
            <span className="text-xs text-muted">{timeAgo(ticket.createdAt)}</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <IconX size={16} />
        </button>
      </div>

      <p className="text-sm text-muted-foreground border-l-2 border-border pl-4">{ticket.description}</p>

      <div className="rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-foreground">
            Conversation {ticket.messages?.length ? `(${ticket.messages.length})` : ""}
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-3 p-5">
          {(!ticket.messages || ticket.messages.length === 0) ? (
            <p className="text-center text-sm text-muted py-10">No messages yet. Admin will respond shortly.</p>
          ) : (
            ticket.messages.map((msg) => (
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
        {ticket.status !== "CLOSED" && (
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
