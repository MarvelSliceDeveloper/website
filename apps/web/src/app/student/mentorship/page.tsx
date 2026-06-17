"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type MentorshipTicket = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  joinUrl?: string;
  notes?: string;
  student: { id: string; name: string; email: string };
  mentor?: { id: string; name: string; email: string } | null;
  course?: { id: string; title: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  OPEN:      { label: "Waiting review",  classes: "border-warning/30 bg-warning/10 text-warning" },
  ASSIGNED:  { label: "Mentor assigned", classes: "border-accent/30 bg-accent/10 text-accent" },
  SCHEDULED: { label: "Scheduled",       classes: "border-success/30 bg-success/10 text-success" },
  COMPLETED: { label: "Resolved",        classes: "border-primary/30 bg-primary/10 text-primary" },
  CANCELLED: { label: "Cancelled",       classes: "border-danger/30 bg-danger/10 text-danger" },
};

export default function StudentMentorshipPage() {
  const [tickets, setTickets] = useState<MentorshipTicket[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ tickets: MentorshipTicket[] }>("/api/mentorship/tickets/my").catch(() => ({ tickets: [] })),
      api.get<{ courses: { id: string; title: string }[] }>("/api/courses/enrolled").catch(() => ({ courses: [] })),
    ]).then(([ticketsRes, coursesRes]) => {
      setTickets(ticketsRes.tickets || []);
      setCourses(coursesRes.courses || []);
      if ((coursesRes.courses || []).length > 0) setCourseId(coursesRes.courses[0].id);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      const { tickets: updated } = await api.post<{ ticket: MentorshipTicket; tickets: MentorshipTicket[] }>("/api/mentorship/tickets", {
        title: topic.length > 50 ? topic.slice(0, 50) + "..." : topic,
        description: topic,
        courseId,
        preferredDate: preferredDate || undefined,
      });
      if (updated) setTickets(updated);
      else {
        const res = await api.get<{ tickets: MentorshipTicket[] }>("/api/mentorship/tickets/my");
        setTickets(res.tickets || []);
      }
      toast.success("Request submitted");
      setShowForm(false);
      setTopic("");
      setPreferredDate("");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED" || t.status === "SCHEDULED");
  const pastTickets = tickets.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 rounded bg-card-hover" />
          <div className="h-4 w-72 rounded bg-card-hover" />
          <div className="h-24 rounded-xl bg-card-hover" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Student</p>
          <h1 className="text-2xl font-bold text-foreground">1-on-1 Mentorship</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Need focused help? Request a private session with your instructor.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Cancel" : "Request New Session"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <p className="font-semibold text-foreground">New Session Request</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="field" required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Topic / Blocker</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your doubt or blocker in detail..."
              rows={3}
              className="field resize-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Preferred Date (optional)</label>
            <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="field" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-3">Open Requests</p>
        {openTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/50 py-10 text-center">
            <p className="text-sm text-muted-foreground">No open or assigned tickets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-3">Past Sessions</p>
        {pastTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {pastTickets.map((t) => <TicketCard key={t.id} ticket={t} showNotes />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, showNotes = false }: { ticket: MentorshipTicket; showNotes?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{ticket.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ticket.course?.title || "General"}
            {ticket.mentor?.name && ` - Mentor: ${ticket.mentor.name}`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
          {cfg.label}
        </span>
      </div>
      {showNotes && ticket.notes && (
        <div className="mt-3">
          <button onClick={() => setExpanded((v) => !v)} className="text-xs font-medium text-primary hover:underline">
            {expanded ? "Hide Notes" : "View Notes"}
          </button>
          {expanded && (
            <div className="mt-2 rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
              {ticket.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
