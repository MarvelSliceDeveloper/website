"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";

interface Ticket {
  id: string;
  title: string;
  status: string;
  student: { id: string; name: string; email: string };
  mentor?: { id: string; name: string };
  createdAt: string;
}

export default function AdminInboxTicketsPage() {
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Inbox</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Mentorship Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage mentorship requests.
        </p>
      </div>

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
    </div>
  );
}
