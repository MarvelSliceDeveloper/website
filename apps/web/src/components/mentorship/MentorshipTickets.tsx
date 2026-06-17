"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  preferredDate?: string;
  preferredTime?: string;
  scheduledAt?: string;
  joinUrl?: string;
  createdAt: string;
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  OPEN: "bg-warning/15 text-warning border-warning/20",
  ASSIGNED: "bg-primary/15 text-primary-hover border-primary/20",
  SCHEDULED: "bg-success/15 text-success border-success/20",
  COMPLETED: "bg-muted/20 text-muted-foreground border-border",
  CANCELLED: "bg-danger/15 text-danger border-danger/20",
};

const statusLabels: Record<string, string> = {
  OPEN: "Pending Review",
  ASSIGNED: "Mentor Assigned",
  SCHEDULED: "Session Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface MentorshipTicketsProps {
  tickets: Ticket[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function MentorshipTickets({
  tickets,
  isLoading,
  onRefresh,
}: MentorshipTicketsProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-5 animate-pulse"
          >
            <div className="h-4 w-1/3 rounded bg-border mb-3" />
            <div className="h-3 w-2/3 rounded bg-border" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No mentorship requests yet
        </h3>
        <p className="mt-1 text-sm text-muted">
          Click the button above to request your first 1-on-1 session with a mentor.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {ticket.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[ticket.status]
                    }`}
                  >
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <p className="text-sm text-muted line-clamp-2">
                  {ticket.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span>
                    Submitted: {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  {ticket.preferredDate && (
                    <span>
                      Preferred: {new Date(ticket.preferredDate).toLocaleDateString()}
                      {ticket.preferredTime && ` (${ticket.preferredTime})`}
                    </span>
                  )}
                  {ticket.mentor && (
                    <span className="text-primary">
                      Mentor: {ticket.mentor.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-muted">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}

function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  const isScheduled = ticket.status === "SCHEDULED" || ticket.status === "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-foreground">{ticket.title}</h2>
            <span
              className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                statusColors[ticket.status]
              }`}
            >
              {statusLabels[ticket.status]}
            </span>
          </div>
          <p className="text-sm text-muted">
            Submitted on {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Description
            </h3>
            <p className="text-sm text-muted bg-card-hover rounded-lg p-3">
              {ticket.description}
            </p>
          </div>

          {ticket.mentor && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Assigned Mentor
              </h3>
              <div className="flex items-center gap-3 bg-card-hover rounded-lg p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
                  {ticket.mentor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ticket.mentor.name}
                  </p>
                  <p className="text-xs text-muted">{ticket.mentor.email}</p>
                </div>
              </div>
            </div>
          )}

          {isScheduled && ticket.scheduledAt && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Scheduled Session
              </h3>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-foreground mb-2">
                  <span className="font-medium">Date & Time:</span>{" "}
                  {new Date(ticket.scheduledAt).toLocaleString()}
                </p>
                {ticket.joinUrl && ticket.status === "SCHEDULED" && (
                  <a
                    href={ticket.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Join Session
                  </a>
                )}
              </div>
            </div>
          )}

          {ticket.preferredDate && !ticket.scheduledAt && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Your Preferred Time
              </h3>
              <p className="text-sm text-muted">
                {new Date(ticket.preferredDate).toLocaleDateString()}
                {ticket.preferredTime && ` (${ticket.preferredTime})`}
              </p>
              <p className="text-xs text-muted mt-1">
                We&apos;ll try to schedule around your preference
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
