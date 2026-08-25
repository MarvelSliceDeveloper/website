"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconRefresh,
  IconHeartHandshake,
  IconUserPlus,
  IconUserCheck,
  IconCalendarEvent,
  IconClipboardCheck,
  IconX,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react";

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
  OPEN: "bg-warning/10 text-warning border-warning/25",
  ASSIGNED: "bg-primary/10 text-primary-hover border-primary/25",
  SCHEDULED: "bg-success/10 text-success border-success/25",
  COMPLETED: "bg-muted/10 text-muted-foreground border-border",
  CANCELLED: "bg-danger/10 text-danger border-danger/25",
};

const statusDots: Record<string, string> = {
  OPEN: "bg-warning",
  ASSIGNED: "bg-primary",
  SCHEDULED: "bg-success",
  COMPLETED: "bg-muted",
  CANCELLED: "bg-danger",
};

const statusLabels: Record<string, string> = {
  OPEN: "Pending Review",
  ASSIGNED: "Mentor Assigned",
  SCHEDULED: "Session Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminMentorshipPage() {
  usePageTitle("Mentorship");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const ticketsQuery = useApiQuery<{ tickets?: Ticket[] }>(
    ["admin", "mentorship", "tickets"],
    "/api/mentorship/tickets",
  );
  const tickets = ticketsQuery.data?.tickets ?? [];
  const mentorsQuery = useApiQuery<{ mentors?: Mentor[] }>(
    ["admin", "mentorship", "mentors"],
    "/api/mentorship/mentors",
  );
  const mentors = mentorsQuery.data?.mentors ?? [];
  type MentorshipStats = {
    total: number;
    open: number;
    assigned: number;
    scheduled: number;
    completed: number;
  };

  const statsQuery = useApiQuery<{ stats: MentorshipStats }>(
    ["admin", "mentorship", "stats"],
    "/api/mentorship/stats",
  );
  const stats: MentorshipStats = statsQuery.data?.stats ?? {
    total: 0,
    open: 0,
    assigned: 0,
    scheduled: 0,
    completed: 0,
  };
  const isLoading =
    ticketsQuery.isPending || mentorsQuery.isPending || statsQuery.isPending;

  const refetchAll = () => {
    void ticketsQuery.refetch();
    void mentorsQuery.refetch();
    void statsQuery.refetch();
  };

  const visibleTickets = tickets;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Mentorship Management"
        description="Manage 1-on-1 mentorship requests and assign mentors to students"
        breadcrumbs={[{ label: "Mentorship", href: "/admin/mentorship" }]}
        action={
          <button
            onClick={refetchAll}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Requests"
          value={stats.total}
          icon={<IconHeartHandshake size={20} stroke={1.5} />}
          color="text-primary"
          chip="bg-primary/15 text-primary border-primary/25"
          hover="hover:border-primary/50"
        />
        <StatCard
          label="Pending Review"
          value={stats.open}
          icon={<IconUserPlus size={20} stroke={1.5} />}
          color="text-warning"
          chip="bg-warning/15 text-warning border-warning/25"
          hover="hover:border-warning/50"
        />
        <StatCard
          label="Mentor Assigned"
          value={stats.assigned}
          icon={<IconUserCheck size={20} stroke={1.5} />}
          color="text-indigo-500"
          chip="bg-indigo-500/15 text-indigo-500 border-indigo-500/25"
          hover="hover:border-indigo-500/50"
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<IconCalendarEvent size={20} stroke={1.5} />}
          color="text-success"
          chip="bg-success/15 text-success border-success/25"
          hover="hover:border-success/50"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<IconClipboardCheck size={20} stroke={1.5} />}
          color="text-muted-foreground"
          chip="bg-muted/15 text-muted-foreground border-border"
          hover="hover:border-border/60"
        />
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Mentorship Requests
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {visibleTickets.length}
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-border/60"
              />
            ))}
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconHeartHandshake size={22} stroke={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">
              No mentorship requests found
            </p>
            <p className="text-xs text-muted">
              New student requests will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-border bg-card-hover/50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Student
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Topic
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Mentor
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Submitted
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visibleTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="group transition-colors hover:bg-card-hover/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-sm">
                          {ticket.student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {ticket.student.name}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {ticket.student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <p className="truncate text-sm font-medium text-foreground">
                        {ticket.title}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusColors[ticket.status]
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusDots[ticket.status]
                          }`}
                        />
                        {statusLabels[ticket.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ticket.mentor ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success text-[10px] font-bold">
                            {ticket.mentor.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-foreground">
                            {ticket.mentor.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">
                        {timeAgo(ticket.createdAt)}
                      </p>
                      {ticket.preferredDate && (
                        <p className="text-[11px] text-muted">
                          {new Date(ticket.preferredDate).toLocaleDateString()}
                          {ticket.preferredTime && ` · ${ticket.preferredTime}`}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 cursor-pointer"
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
          onUpdate={refetchAll}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  chip,
  hover,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  chip: string;
  hover: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 transition-all duration-300 ${hover}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p
            className={`mt-1.5 text-2xl font-extrabold tracking-tight ${color}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${chip}`}
        >
          {icon}
        </div>
      </div>
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
    ticket.scheduledAt
      ? new Date(ticket.scheduledAt).toISOString().slice(0, 16)
      : "",
  );
  const [joinUrl, setJoinUrl] = useState(ticket.joinUrl || "");
  const [completionNotes, setCompletionNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  const assignMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/mentorship/tickets/${ticket.id}/assign`, {
        mentorId: selectedMentor,
      }),
    onSuccess: () => {
      toast.success("Mentor assigned successfully");
      onUpdate();
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to assign mentor",
      ),
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/mentorship/tickets/${ticket.id}/schedule`, {
        scheduledAt: new Date(scheduledDate).toISOString(),
        joinUrl: joinUrl || undefined,
      }),
    onSuccess: () => {
      toast.success("Session scheduled successfully");
      onUpdate();
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule session",
      ),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/mentorship/tickets/${ticket.id}/complete`, {
        notes: completionNotes || undefined,
      }),
    onSuccess: () => {
      toast.success("Mentorship marked as completed");
      onUpdate();
      onClose();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to complete"),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/mentorship/tickets/${ticket.id}/cancel`, {}),
    onSuccess: () => {
      toast.success("Mentorship request cancelled");
      onUpdate();
      onClose();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to cancel"),
  });

  const isSubmitting =
    assignMutation.isPending ||
    scheduleMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  const handleAssignMentor = () => {
    if (!selectedMentor) {
      toast.error("Please select a mentor");
      return;
    }
    assignMutation.mutate();
  };

  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error("Please select a date and time");
      return;
    }
    scheduleMutation.mutate();
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-base font-bold text-white shadow-sm">
              {ticket.student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {ticket.student.name}
              </h2>
              <p className="text-xs text-muted">{ticket.student.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                statusColors[ticket.status]
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDots[ticket.status]}`}
              />
              {statusLabels[ticket.status]}
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card-hover hover:text-foreground cursor-pointer"
              aria-label="Close"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Ticket Details */}
          <div className="mb-6 rounded-xl border border-border bg-card-hover/40 p-4">
            <p className="text-sm font-semibold text-foreground mb-1.5">
              {ticket.title}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              {ticket.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ticket.preferredDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground">
                  <IconCalendar size={13} className="text-muted" />
                  {new Date(ticket.preferredDate).toLocaleDateString()}
                  {ticket.preferredTime && ` · ${ticket.preferredTime}`}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted">
                <IconUser size={13} />
                {ticket.mentor
                  ? `Mentor: ${ticket.mentor.name}`
                  : "No mentor assigned yet"}
              </span>
            </div>
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
                  <Select
                    value={selectedMentor}
                    onValueChange={setSelectedMentor}
                  >
                    <SelectTrigger className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
                      <SelectValue placeholder="Select a mentor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          {mentor.name} ({mentor.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            {(ticket.status === "OPEN" ||
              ticket.status === "ASSIGNED" ||
              ticket.status === "SCHEDULED") && (
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
                  <h3 className="text-sm font-semibold text-foreground">
                    Session Notes
                  </h3>
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
                  className="flex-1 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Mark Complete
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
