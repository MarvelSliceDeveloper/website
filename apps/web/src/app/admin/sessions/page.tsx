"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  IconCalendar,
  IconEdit,
  IconSearch,
  IconTrash,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type Session = {
  id: string;
  title?: string;
  joinUrl: string;
  scheduledAt: string;
  scheduledEndAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batch: { id: string; name: string; course: { title: string } } | null;
  recording: { id: string } | null;
  _count?: { attendance: number };
  attendance?: { _avg: { durationSeconds: number | null } } | null;
};

type SessionsResponse = {
  sessions?: Session[];
};

type Tab = "ALL" | "UPCOMING" | "PAST";

export default function AdminSessionsPage() {
  usePageTitle("Sessions");

  // Edit modal state
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const confirmDelete = useConfirmDialog();

  // Dashboard controls
  const [tab, setTab] = useState<Tab>("ALL");
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");

  const sessionsQuery = useApiQuery<SessionsResponse>(
    ["admin", "sessions"],
    "/api/sessions",
  );
  const sessions = sessionsQuery.data?.sessions ?? [];
  const loading = sessionsQuery.isPending;

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const { liveNow, upcoming, past } = useMemo(() => {
    const live = sessions.filter((s) => {
      const start = new Date(s.scheduledAt).getTime();
      const end = new Date(s.scheduledEndAt).getTime();
      return !s.endedAt && start <= now && end >= now;
    });
    const up = sessions
      .filter((s) => {
        const end = new Date(s.scheduledEndAt).getTime();
        return !s.endedAt && end > now;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    const pa = sessions
      .filter((s) => {
        const end = new Date(s.scheduledEndAt).getTime();
        return s.endedAt || end <= now;
      })
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      );
    return { liveNow: live, upcoming: up, past: pa };
  }, [sessions, now]);

  const upNext = upcoming[0] ?? null;
  const todayCount = useMemo(() => {
    const today = new Date(now).toDateString();
    return sessions.filter(
      (s) => new Date(s.scheduledAt).toDateString() === today,
    ).length;
  }, [sessions, now]);

  const batchNames = useMemo(() => {
    const names = new Set<string>();
    for (const s of sessions) names.add(s.batch?.name ?? "General");
    return [...names].sort();
  }, [sessions]);

  const liveIds = useMemo(() => new Set(liveNow.map((s) => s.id)), [liveNow]);

  const visible = useMemo(() => {
    const base = tab === "UPCOMING" ? upcoming : tab === "PAST" ? past : [...upcoming, ...past];
    const q = query.trim().toLowerCase();
    return base.filter((s) => {
      if (batchFilter !== "all" && (s.batch?.name ?? "General") !== batchFilter)
        return false;
      if (!q) return true;
      const haystack =
        `${s.batch?.course?.title ?? ""} ${s.batch?.name ?? ""} ${s.title ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [tab, upcoming, past, query, batchFilter]);

  const openEdit = (session: Session) => {
    setEditingSession(session);
    setEditTitle(
      session.batch?.course
        ? `${session.batch.course.title} — ${session.batch.name}`
        : session.batch
          ? `${session.batch.name}`
          : "Mentorship Session",
    );
    setEditStart(new Date(session.scheduledAt).toISOString().slice(0, 16));
    setEditEnd(new Date(session.scheduledEndAt).toISOString().slice(0, 16));
  };

  const editMutation = useMutation({
    mutationFn: ({
      id,
      title,
      startDateTime,
      endDateTime,
    }: {
      id: string;
      title: string;
      startDateTime: string;
      endDateTime: string;
    }) =>
      api.patch(`/api/sessions/${id}`, {
        title,
        startDateTime,
        endDateTime,
      }),
    onSuccess: () => {
      toast.success("Session updated successfully");
      setEditingSession(null);
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    editMutation.mutate({
      id: editingSession.id,
      title: editTitle,
      startDateTime: new Date(editStart).toISOString(),
      endDateTime: new Date(editEnd).toISOString(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/sessions/${sessionId}`),
    onSuccess: () => {
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (sessionId: string) => {
    if (
      !(await confirmDelete({
        title: "Delete Session",
        message:
          "Are you sure you want to permanently delete this session? This will remove all associated data (attendance, calendar events, recordings).",
      }))
    )
      return;
    deleteMutation.mutate(sessionId);
  };

  const hasFilters = query.trim() !== "" || batchFilter !== "all";

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Sessions"
        description={`${sessions.length} total sessions`}
        breadcrumbs={[{ label: "Sessions", href: "/admin/sessions" }]}
        action={
          <Link href="/admin/sessions/new" className="btn-primary">
            + Schedule Session
          </Link>
        }
      />

      {loading ? (
        <CardSkeleton count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          variant="glass"
          icon={IconVideo}
          title="No sessions yet"
          description="Schedule a live session for a batch."
          action={
            <Link
              href="/admin/sessions/new"
              className="btn-primary inline-flex"
            >
              + Schedule Session
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Hero strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${liveNow.length > 0 ? "live-pulse bg-emerald-500" : "bg-muted-foreground/40"}`}
                />
                Live Now
              </p>
              <p className="mt-1.5 text-2xl font-bold text-foreground">
                {liveNow.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {liveNow.length > 0
                  ? liveNow[0].batch?.course?.title ?? liveNow[0].batch?.name ?? "Session in progress"
                  : "No session in progress"}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Up Next
              </p>
              <p className="mt-1.5 text-2xl font-bold text-foreground">
                {upNext
                  ? new Date(upNext.scheduledAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {upNext
                  ? (upNext.batch?.course?.title ?? upNext.batch?.name ?? "Session")
                  : "Nothing scheduled"}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Today
              </p>
              <p className="mt-1.5 text-2xl font-bold text-foreground">
                {todayCount}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {todayCount === 1 ? "session scheduled" : "sessions scheduled"}
              </p>
            </div>
          </div>

          {/* Controls: tabs + search + batch filter */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit">
              {(
                [
                  { key: "ALL", label: `All (${sessions.length})` },
                  { key: "UPCOMING", label: `Upcoming (${upcoming.length})` },
                  { key: "PAST", label: `Past (${past.length})` },
                ] as { key: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <IconSearch
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search course or batch..."
                  className="field pl-9 sm:w-64"
                />
              </div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="field sm:w-48"
                aria-label="Filter by batch"
              >
                <option value="all">All batches</option>
                {batchNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Session list */}
          {visible.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                No sessions match your filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search term or batch.
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setQuery("");
                    setBatchFilter("all");
                  }}
                  className="btn-secondary mt-4 text-xs"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  live={liveIds.has(session.id)}
                  upcoming={
                    !session.endedAt &&
                    new Date(session.scheduledEndAt).getTime() > now
                  }
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <FormModal
        open={editingSession !== null}
        onClose={() => setEditingSession(null)}
        title="Edit Session"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingSession(null)}
              className="btn-secondary text-xs px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-session-form"
              disabled={editMutation.isPending}
              className="btn-primary text-xs px-4"
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <form
          id="edit-session-form"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Session Title
            </label>
            <input
              type="text"
              className="field"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Start
              </label>
              <input
                type="datetime-local"
                className="field"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                End
              </label>
              <input
                type="datetime-local"
                className="field"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function SessionCard({
  session,
  upcoming,
  live,
  onEdit,
  onDelete,
}: {
  session: Session;
  upcoming: boolean;
  live: boolean;
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
}) {
  const start = new Date(session.scheduledAt);
  const end = new Date(session.scheduledEndAt);
  const durationMin = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000),
  );

  const status = session.endedAt
    ? { label: "Cancelled", classes: "bg-danger/15 text-danger" }
    : live
      ? { label: "Live", classes: "bg-emerald-500/15 text-emerald-500" }
      : upcoming
        ? { label: "Upcoming", classes: "bg-primary/15 text-primary" }
        : { label: "Completed", classes: "bg-muted/15 text-muted-foreground" };

  return (
    <div className="glass-card p-4 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      {/* Date block */}
      <div
        className={`flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-xl py-2 ${
          live ? "bg-emerald-500/15" : "bg-primary/10"
        }`}
      >
        <span className="text-xl font-bold leading-none text-foreground">
          {start.getDate()}
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {start.toLocaleString("en-IN", { month: "short" })}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {start.toLocaleString("en-IN", { weekday: "short" })}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {session.batch?.course
            ? `${session.batch.course.title} · ${session.batch.name}`
            : session.batch
              ? session.batch.name
              : "Standalone Session"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconCalendar size={13} className="shrink-0" />
          {start.toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" — "}
          {end.toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          <span className="text-muted">· {durationMin}m</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${status.classes}`}
          >
            {live && (
              <span className="live-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {status.label}
          </span>
          <span className="text-[10px] uppercase font-medium bg-accent/15 text-accent px-1.5 py-0.5 rounded">
            {session.createdFrom}
          </span>
          {!upcoming && !live && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              <IconUsers size={10} />
              {session._count?.attendance ?? 0} attended
              {session.attendance?._avg?.durationSeconds
                ? ` · avg ${Math.round(session.attendance._avg.durationSeconds / 60)}m`
                : ""}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(session)}
            className="p-1.5 rounded-lg border border-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
            title="Edit session"
          >
            <IconEdit size={15} />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="btn-danger p-1.5"
            title="Delete session"
          >
            <IconTrash size={15} />
          </button>
        </div>
        {upcoming || live ? (
          <a
            href={session.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs shrink-0"
          >
            {live ? "Join Live →" : "Join →"}
          </a>
        ) : (
          <Link
            href={`/admin/sessions/${session.id}`}
            className="btn-secondary text-xs shrink-0"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}
