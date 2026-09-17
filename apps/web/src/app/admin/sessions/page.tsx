"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  IconCalendar,
  IconEdit,
  IconPlus,
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
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";


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
          <Link href="/admin/sessions/new">
            <Button leftIcon={<IconPlus size={16} />}>
              Schedule Session
            </Button>
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
            <Link href="/admin/sessions/new" className="mt-4 inline-flex">
              <Button leftIcon={<IconPlus size={16} />}>Schedule Session</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Hero strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Live Now
                </p>
                {liveNow.length > 0 ? (
                  <Badge variant="success" size="sm" dot>Live</Badge>
                ) : (
                  <Badge variant="secondary" size="sm">Idle</Badge>
                )}
              </div>
              <p className="mt-2 text-2xl font-black text-foreground">
                {liveNow.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {liveNow.length > 0
                  ? liveNow[0].batch?.course?.title ?? liveNow[0].batch?.name ?? "Session in progress"
                  : "No session in progress"}
              </p>
            </Card>

            <Card className="p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Up Next
              </p>
              <p className="mt-2 text-2xl font-black text-foreground truncate">
                {upNext
                  ? new Date(upNext.scheduledAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {upNext
                  ? (upNext.batch?.course?.title ?? upNext.batch?.name ?? "Session")
                  : "Nothing scheduled"}
              </p>
            </Card>

            <Card className="p-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              <p className="mt-2 text-2xl font-black text-foreground">
                {todayCount}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {todayCount === 1 ? "session scheduled" : "sessions scheduled"}
              </p>
            </Card>
          </div>

          {/* Controls: tabs + search + batch filter */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit shadow-2xs">
              {(
                [
                  { key: "ALL", label: `All (${sessions.length})` },
                  { key: "UPCOMING", label: `Upcoming (${upcoming.length})` },
                  { key: "PAST", label: `Past (${past.length})` },
                ] as { key: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    tab === t.key
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="sm:w-64">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search course or batch..."
                />
              </div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-2xs transition-all duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border-hover sm:w-48"
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
            <Card className="p-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                No sessions match your filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search term or batch.
              </p>
              {hasFilters && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setBatchFilter("all");
                  }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingSession(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-session-form"
              size="sm"
              loading={editMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form
          id="edit-session-form"
          onSubmit={handleEditSubmit}
          className="space-y-4"
        >
          <FormField label="Session Title" required htmlFor="session-title">
            <Input
              id="session-title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start" required htmlFor="session-start">
              <Input
                id="session-start"
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                required
              />
            </FormField>
            <FormField label="End" required htmlFor="session-end">
              <Input
                id="session-end"
                type="datetime-local"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                required
              />
            </FormField>
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

  return (
    <Card hoverable className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Date block */}
        <div
          className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2.5 border ${
            live
              ? "bg-success/10 text-success border-success/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          <span className="text-xl font-black leading-none">
            {start.getDate()}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">
            {start.toLocaleString("en-IN", { month: "short" })}
          </span>
          <span className="text-[10px] opacity-75">
            {start.toLocaleString("en-IN", { weekday: "short" })}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {session.batch?.course
              ? `${session.batch.course.title} · ${session.batch.name}`
              : session.batch
                ? session.batch.name
                : (session.title ?? "Standalone Session")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCalendar size={13} className="shrink-0 text-primary" />
            {start.toLocaleString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" — "}
            {end.toLocaleString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span className="text-muted-foreground/60">· {durationMin}m</span>
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {session.endedAt ? (
              <Badge variant="danger" size="sm" dot>Cancelled</Badge>
            ) : live ? (
              <Badge variant="success" size="sm" dot>Live</Badge>
            ) : upcoming ? (
              <Badge variant="default" size="sm" dot>Upcoming</Badge>
            ) : (
              <Badge variant="secondary" size="sm">Completed</Badge>
            )}

            <Badge variant="outline" size="sm">
              {session.createdFrom}
            </Badge>

            {!upcoming && !live && (
              <Badge variant="secondary" size="sm">
                <IconUsers size={11} className="mr-1 inline" />
                {session._count?.attendance ?? 0} attended
                {session.attendance?._avg?.durationSeconds
                  ? ` · avg ${Math.round(session.attendance._avg.durationSeconds / 60)}m`
                  : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(session)}
            className="p-1.5 rounded-xl border border-border hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all duration-150 shadow-2xs hover:border-border-hover"
            title="Edit session"
          >
            <IconEdit size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="p-1.5 rounded-xl border border-danger/30 hover:bg-danger/10 text-danger transition-all duration-150 shadow-2xs"
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
            className="inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.99] h-8 px-3.5 text-xs rounded-lg gap-1.5 shrink-0"
          >
            {live ? "Join Live →" : "Join →"}
          </a>
        ) : (
          <Link href={`/admin/sessions/${session.id}`}>
            <Button variant="secondary" size="sm">
              View Details
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

