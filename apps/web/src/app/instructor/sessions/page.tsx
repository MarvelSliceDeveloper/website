"use client";

import { useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  IconUsers,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconVideo,
  IconExternalLink,
} from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

type Session = {
  id: string;
  title?: string | null;
  joinUrl: string | null;
  scheduledAt: string;
  scheduledEndAt?: string | null;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batchId: string;
  moduleId: string | null;
  batch: {
    id: string;
    name: string;
    course: { id: string; title: string } | null;
    package?: { id: string; name: string } | null;
  } | null;
  recording: { id: string } | null;
  _count?: { attendance: number };
};

type AttendanceRecord = {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

function isSessionUpcoming(session: Session, now: Date) {
  return !session.endedAt && new Date(session.scheduledAt) >= now;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InstructorSessionsPage() {
  usePageTitle("Sessions");
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <p className="text-muted animate-pulse">Loading sessions...</p>
        </div>
      }
    >
      <SessionsPageContent />
    </Suspense>
  );
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusFilter = searchParams.get("status");
  const confirmDelete = useConfirmDialog();

  const [search, setSearch] = useState("");

  const setStatusFilter = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Shares the cache key with the instructor dashboard's ["instructor","sessions"].
  const sessionsQuery = useApiQuery<{ sessions?: Session[] }>(
    ["instructor", "sessions"],
    "/api/sessions",
  );
  const sessions = sessionsQuery.data?.sessions ?? [];
  const loading = sessionsQuery.isPending;

  // Attendance modal state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const [form, setForm] = useState({
    courseId: "",
    batchId: "",
    moduleId: "",
    title: "",
    startDateTime: "",
    endDateTime: "",
    customJoinUrl: "",
  });

  const editMutation = useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: {
        title?: string;
        startDateTime: string;
        endDateTime: string;
      };
    }) => api.patch(`/api/sessions/${sessionId}`, payload),
    onSuccess: () => {
      setShowEditModal(false);
      setEditingSession(null);
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success("Session cancelled successfully!");
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const openEditModal = (session: Session) => {
    setEditingSession(session);
    setForm({
      courseId: session.batch?.course?.id || "",
      batchId: session.batchId,
      moduleId: session.moduleId || "",
      title: session.title || "Live Session",
      startDateTime: new Date(session.scheduledAt).toISOString().slice(0, 16),
      endDateTime: new Date(
        session.scheduledEndAt
          ? new Date(session.scheduledEndAt).getTime()
          : new Date(session.scheduledAt).getTime() + 3600000,
      )
        .toISOString()
        .slice(0, 16),
      customJoinUrl:
        session.createdFrom === "LMS_CUSTOM" ? (session.joinUrl ?? "") : "",
    });
    setShowEditModal(true);
  };

  const handleEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    editMutation.mutate({
      sessionId: editingSession.id,
      payload: {
        title: form.title || undefined,
        startDateTime: new Date(form.startDateTime).toISOString(),
        endDateTime: new Date(form.endDateTime).toISOString(),
      },
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (
      !(await confirmDelete({
        title: "Cancel Session",
        message:
          "Are you sure you want to cancel this live session? This will mark it as ended.",
      }))
    )
      return;
    deleteMutation.mutate(sessionId);
  };

  const handleViewAttendance = async (session: Session) => {
    setSelectedSession(session);
    setLoadingAttendance(true);
    try {
      const data = await api.get<{ attendance: AttendanceRecord[] }>(
        `/api/attendance/${session.id}`,
      );
      setAttendance(data.attendance || []);
    } catch (err: unknown) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const now = new Date();

  // Counts and rows are memoized so the table's data reference stays stable
  // between renders (DataTable keeps its own page state and resets on new data).
  const totals = useMemo(() => {
    const reference = new Date();
    const upcoming = sessions.filter((s) =>
      isSessionUpcoming(s, reference),
    ).length;
    return { upcoming, past: sessions.length - upcoming };
  }, [sessions]);

  const rows = useMemo(() => {
    const reference = new Date();
    let list = sessions;

    if (statusFilter === "UPCOMING") {
      list = sessions.filter((s) => isSessionUpcoming(s, reference));
    } else if (statusFilter === "PAST") {
      list = sessions.filter((s) => !isSessionUpcoming(s, reference));
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((session) =>
        [
          session.title,
          session.batch?.name,
          session.batch?.course?.title,
          session.batch?.package?.name,
          session.createdFrom,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term)),
      );
    }

    // Upcoming first (soonest at the top), then past sessions (most recent first).
    return [...list].sort((a, b) => {
      const aUpcoming = isSessionUpcoming(a, reference);
      const bUpcoming = isSessionUpcoming(b, reference);
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      return aUpcoming ? aTime - bTime : bTime - aTime;
    });
  }, [sessions, statusFilter, search]);

  const columns: DataTableColumn<Session>[] = [
    {
      key: "title",
      label: "Session",
      render: (_, session) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              isSessionUpcoming(session, now)
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted/15 text-muted-foreground border-border"
            }`}
          >
            {isSessionUpcoming(session, now) ? (
              <IconCalendar size={18} stroke={1.8} />
            ) : (
              <IconVideo size={18} stroke={1.8} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {session.title || "Live Session"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {session.createdFrom}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "course",
      label: "Course",
      render: (_, session) => (
        <span className="text-sm text-foreground">
          {session.batch?.course?.title ??
            session.batch?.package?.name ??
            "—"}
        </span>
      ),
    },
    {
      key: "batch",
      label: "Batch",
      render: (_, session) => (
        <span className="text-sm text-muted-foreground">
          {session.batch?.name || "General"}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      label: "Schedule",
      render: (_, session) => (
        <div className="whitespace-nowrap">
          <p className="text-sm font-medium text-foreground">
            {formatDate(session.scheduledAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(session.scheduledAt)}
            {session.scheduledEndAt
              ? ` – ${formatTime(session.scheduledEndAt)}`
              : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, session) => (
        <Badge
          variant={isSessionUpcoming(session, now) ? "success" : "secondary"}
          size="sm"
          dot
        >
          {isSessionUpcoming(session, now) ? "Upcoming" : "Past"}
        </Badge>
      ),
    },
    {
      key: "attendance",
      label: "Attendance",
      render: (_, session) => (
        <button
          type="button"
          onClick={() => handleViewAttendance(session)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
          title="View attendance"
        >
          <IconUsers size={14} />
          {session._count?.attendance ?? 0}
        </button>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, session) => (
        <div className="flex items-center gap-1.5">
          <a
            href={session.joinUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary shadow-2xs transition-all duration-150 hover:bg-primary/15"
            title={isSessionUpcoming(session, now) ? "Start class" : "View meeting link"}
          >
            <IconExternalLink size={13} />
            {isSessionUpcoming(session, now) ? "Start" : "Link"}
          </a>
          <button
            type="button"
            onClick={() => openEditModal(session)}
            className="cursor-pointer rounded-lg border border-border p-1.5 text-muted-foreground shadow-2xs transition-all duration-150 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
            title="Edit session"
            aria-label="Edit session"
          >
            <IconEdit size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteSession(session.id)}
            disabled={
              deleteMutation.isPending &&
              deleteMutation.variables === session.id
            }
            className="cursor-pointer rounded-lg border border-danger/30 p-1.5 text-danger shadow-2xs transition-all duration-150 hover:bg-danger/10 disabled:opacity-40"
            title="Cancel session"
            aria-label="Cancel session"
          >
            <IconTrash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
      <AdminPageHeader
        title="My Sessions"
        breadcrumbs={[{ label: "Sessions", href: "/instructor/sessions" }]}
        role="Instructor"
        description={
          loading
            ? "Manage your live classes and review student attendance."
            : `${totals.upcoming} upcoming · ${totals.past} past · manage your live classes and review student attendance.`
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        pageSize={10}
        headerVariant="blue"
        toolbar={
          <>
            <div className="flex items-center gap-2">
              <label
                htmlFor="session-status-filter"
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </label>
              <select
                id="session-status-filter"
                value={
                  statusFilter === "UPCOMING" || statusFilter === "PAST"
                    ? statusFilter
                    : "ALL"
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value === "ALL" ? null : e.target.value,
                  )
                }
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="ALL">All ({sessions.length})</option>
                <option value="UPCOMING">Upcoming ({totals.upcoming})</option>
                <option value="PAST">Past ({totals.past})</option>
              </select>
            </div>

            <div className="w-full max-w-xs">
              <SearchInput
                placeholder="Search session, course or batch..."
                value={search}
                onChange={setSearch}
              />
            </div>
          </>
        }
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconVideo}
            title={
              search.trim()
                ? "No matching sessions"
                : statusFilter === "UPCOMING"
                  ? "No upcoming sessions"
                  : statusFilter === "PAST"
                    ? "No past sessions"
                    : "No sessions assigned"
            }
            description={
              search.trim()
                ? "No sessions match your search. Try a different keyword."
                : statusFilter === "UPCOMING"
                  ? "You don't have any live classes scheduled ahead. Check back once sessions are added."
                  : statusFilter === "PAST"
                    ? "None of your sessions have completed yet."
                    : "You do not have any live sessions scheduled yet. Check back once sessions are added."
            }
          />
        }
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <h3 className="font-bold text-foreground">Edit Live Session</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 hover:bg-muted/30 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSession} className="p-4 space-y-4">
              <FormField label="Session Title" required>
                <Input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Date & Time" required>
                  <Input
                    type="datetime-local"
                    value={form.startDateTime}
                    onChange={(e) =>
                      setForm({ ...form, startDateTime: e.target.value })
                    }
                    required
                  />
                </FormField>
                <FormField label="End Date & Time" required>
                  <Input
                    type="datetime-local"
                    value={form.endDateTime}
                    onChange={(e) =>
                      setForm({ ...form, endDateTime: e.target.value })
                    }
                    required
                  />
                </FormField>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={editMutation.isPending}
                >
                  Update Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <div>
                <h3 className="font-bold text-foreground">
                  Session Attendance
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSession.batch?.course?.title ??
                    selectedSession.batch?.package?.name ??
                    "Course"}{" "}
                  · {selectedSession.batch?.name ?? "Batch"}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg p-1 hover:bg-muted/30 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[350px] overflow-y-auto">
              {loadingAttendance ? (
                <div className="py-8 text-center text-sm text-muted animate-pulse">
                  Loading attendance sheet...
                </div>
              ) : attendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No attendance records found. Either no students clicked
                  &quot;Join Now&quot;, or the session hasn&apos;t started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {record.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <IconCheck size={12} /> Joined
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(record.joinedAt).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card p-3 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
