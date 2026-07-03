"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  preferredDate?: string;
  preferredTime?: string;
  scheduledAt?: string;
  joinUrl?: string;
  teamsMeetingId?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function AdminMentorshipPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    scheduled: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ticketsRes, mentorsRes, statsRes] = await Promise.allSettled([
        api.get<{ tickets?: Ticket[] }>("/api/mentorship/tickets"),
        api.get<{ mentors?: Mentor[] }>("/api/mentorship/mentors"),
        api.get<{ stats: typeof stats }>("/api/mentorship/stats"),
      ]);

      if (ticketsRes.status === "fulfilled") {
        setTickets(ticketsRes.value.tickets || []);
      }
      if (mentorsRes.status === "fulfilled") {
        setMentors(mentorsRes.value.mentors || []);
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.stats);
      }
    } catch (error) {
      console.error("Failed to fetch mentorship data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, []);

  const filteredTickets =
    filter === "all"
      ? tickets
      : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
          <h1 className="text-2xl font-bold text-foreground">
            Mentorship Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage 1-on-1 mentorship requests and assign mentors to students
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} color="from-primary to-violet-500" />
        <StatCard label="Pending" value={stats.open} color="from-warning to-amber-400" />
        <StatCard label="Assigned" value={stats.assigned} color="from-accent to-cyan-400" />
        <StatCard label="Scheduled" value={stats.scheduled} color="from-success to-emerald-400" />
        <StatCard label="Completed" value={stats.completed} color="from-muted to-slate-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Requests" },
          { key: "OPEN", label: "Pending Review" },
          { key: "ASSIGNED", label: "Assigned" },
          { key: "SCHEDULED", label: "Scheduled" },
          { key: "COMPLETED", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${filter === tab.key
              ? "border-primary/30 bg-primary/20 text-primary-hover"
              : "border-border bg-card text-muted hover:bg-card-hover hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Mentorship Requests ({filteredTickets.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-border animate-pulse" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted">No mentorship requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-card-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-card-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold">
                          {ticket.student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {ticket.student.name}
                          </p>
                          <p className="text-xs text-muted">
                            {ticket.student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground line-clamp-1">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted line-clamp-1">
                        {ticket.description.substring(0, 50)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[ticket.status]
                          }`}
                      >
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.mentor ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success text-xs font-semibold">
                            {ticket.mentor.name.charAt(0)}
                          </div>
                          <span className="text-sm text-foreground">
                            {ticket.mentor.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Management Modal */}
      {selectedTicket && (
        <TicketManageModal
          ticket={selectedTicket}
          mentors={mentors}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className={`mb-3 h-1 w-full rounded-full bg-gradient-to-r ${color}`} />
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function TicketManageModal({
  ticket,
  mentors,
  onClose,
  onUpdate,
}: {
  ticket: Ticket;
  mentors: Mentor[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [selectedMentor, setSelectedMentor] = useState(ticket.mentor?.id || "");
  const [scheduledDate, setScheduledDate] = useState(
    ticket.scheduledAt ? new Date(ticket.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [joinUrl, setJoinUrl] = useState(ticket.joinUrl || "");
  const [completionNotes, setCompletionNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssignMentor = async () => {
    if (!selectedMentor) {
      toast.error("Please select a mentor");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/api/mentorship/tickets/${ticket.id}/assign`, { mentorId: selectedMentor });
      toast.success("Mentor assigned successfully");
      onUpdate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign mentor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error("Please select a date and time");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch(`/api/mentorship/tickets/${ticket.id}/schedule`, {
        scheduledAt: new Date(scheduledDate).toISOString(),
        joinUrl: joinUrl || undefined,
      });
      toast.success("Session scheduled successfully");
      onUpdate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/api/mentorship/tickets/${ticket.id}/complete`, { notes: completionNotes || undefined });
      toast.success("Mentorship marked as completed");
      onUpdate();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/api/mentorship/tickets/${ticket.id}/cancel`, {});
      toast.success("Mentorship request cancelled");
      onUpdate();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Manage Mentorship Request
          </h2>
          <p className="text-sm text-muted mt-1">
            From: {ticket.student.name} ({ticket.student.email})
          </p>
        </div>

        {/* Ticket Details */}
        <div className="mb-6 p-4 bg-card-hover rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-2">
            {ticket.title}
          </h3>
          <p className="text-sm text-muted">{ticket.description}</p>
          {ticket.preferredDate && (
            <p className="text-xs text-muted mt-2">
              Preferred: {new Date(ticket.preferredDate).toLocaleDateString()}
              {ticket.preferredTime && ` (${ticket.preferredTime})`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {/* Step 1: Assign Mentor */}
          {ticket.status === "OPEN" && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Step 1: Assign Mentor
              </h3>
              <div className="flex gap-3">
                <select
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Select a mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name} ({mentor.role})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignMentor}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Assigning..." : "Assign"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Schedule / Edit Session */}
          {(ticket.status === "OPEN" || ticket.status === "ASSIGNED" || ticket.status === "SCHEDULED") && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {ticket.status === "SCHEDULED"
                  ? "Edit Session"
                  : ticket.status === "ASSIGNED"
                  ? "Schedule Session"
                  : "Step 2: Schedule Session (Optional)"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-muted mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">
                    Teams Join URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                    placeholder="https://teams.microsoft.com/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSchedule}
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Session"}
              </button>
            </div>
          )}

          {/* Scheduled Session Info */}
          {ticket.scheduledAt && (
            <div className="border border-success/30 bg-success/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-success mb-2">
                Session Scheduled
              </h3>
              <p className="text-sm text-foreground">
                Date: {new Date(ticket.scheduledAt).toLocaleString()}
              </p>
              {ticket.joinUrl && (
                <a
                  href={ticket.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary-hover underline mt-1 inline-block"
                >
                  Join URL: {ticket.joinUrl.substring(0, 50)}...
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {ticket.status !== "COMPLETED" && ticket.status !== "CANCELLED" && (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Session Notes</h3>
                <button
                  onClick={() => setShowNotesInput((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {showNotesInput ? "Hide" : "Add notes"}
                </button>
              </div>
              {showNotesInput && (
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add resolution notes, feedback, or key takeaways..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                />
              )}
            </div>
          )}

          {/* Complete / Cancel Buttons */}
          {ticket.status !== "COMPLETED" && ticket.status !== "CANCELLED" && (
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                Mark Complete
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
              >
                Cancel Request
              </button>
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
