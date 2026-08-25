"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePageTitle } from "@/lib/use-page-title";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import {
  IconArrowLeft,
  IconCalendarPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InternSession = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  scheduledEndAt: string | null;
  joinUrl: string | null;
  targetFieldId: string | null;
  field: { id: string; name: string } | null;
};

type FieldOption = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { interns: number };
};

const tabs = [
  { value: "ALL", label: "All Sessions" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "PAST", label: "Past" },
];

export default function AdminInternSchedulePage() {
  usePageTitle("Schedule Intern Class");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [target, setTarget] = useState("ALL");

  const [status, setStatus] = useState("UPCOMING");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fieldsQuery = useApiQuery<{ fields: FieldOption[] }>(
    ["admin", "interns", "fields"],
    "/api/admin/interns/fields",
  );
  const fields = fieldsQuery.data?.fields ?? [];

  // Sessions list keyed on the status tab so switching tabs refetches.
  const sessionsQuery = useApiQuery<{ items: InternSession[] }>(
    ["admin", "interns", "sessions", status],
    "/api/admin/interns/sessions",
    { status },
  );
  const sessions = sessionsQuery.data?.items ?? [];
  const loadingSessions = sessionsQuery.isPending;

  const activeFields = fields.filter((f) => f.isActive);

  const createSessionMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      scheduledAt: string;
      scheduledEndAt?: string;
      joinUrl?: string;
      targetFieldId?: string;
    }) => api.post("/api/admin/interns/sessions", payload),
    onSuccess: () => {
      toast.success("Class scheduled — interns have been notified");
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setEndTime("");
      setJoinUrl("");
      setTarget("ALL");
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Session title is required");
      return;
    }
    if (!date || !time) {
      toast.error("Date and time are required");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const scheduledEndAt = endTime
      ? new Date(`${date}T${endTime}:00`).toISOString()
      : undefined;

    createSessionMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledAt,
      scheduledEndAt,
      joinUrl: joinUrl.trim() || undefined,
      targetFieldId: target === "ALL" ? undefined : target,
    });
  };

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/interns/sessions/${id}`),
    onSuccess: () => {
      setDeleteId(null);
      toast.success("Class deleted");
      void sessionsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSessionMutation.mutate(deleteId);
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Schedule Intern Class"
        description="Schedule an online class for all interns or interns in a specific field."
        breadcrumbs={[
          { label: "Interns", href: "/admin/interns" },
          { label: "Schedule", href: "/admin/interns/schedule" },
        ]}
        action={
          <Link
            href="/admin/interns"
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Manage Interns
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schedule form */}
        <div className="glass-card p-6 space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <IconCalendarPlus size={16} stroke={1.5} className="text-primary" />
            New Online Class
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Fundamentals — Live"
                className="field w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will be covered in this class?"
                className="field w-full min-h-[60px]"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="field w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Start Time <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="field w-full"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="field w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Join URL
              </label>
              <input
                type="url"
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="field w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Who is this for? <span className="text-danger">*</span>
              </label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Interns</SelectItem>
                  {activeFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground italic">
                {target === "ALL"
                  ? "Notify every intern about this class."
                  : `Only interns in the ${fields.find((f) => f.id === target)?.name ?? ""} field will be notified.`}
              </p>
            </div>

            <button
              type="submit"
              disabled={createSessionMutation.isPending}
              className="btn-primary text-sm w-full flex items-center justify-center gap-1.5"
            >
              {createSessionMutation.isPending ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Scheduling...
                </>
              ) : (
                <>
                  <IconCalendarPlus size={16} stroke={1.5} />
                  Schedule Class & Notify
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sessions list */}
        <div className="glass-card p-6 space-y-4 h-fit">
          <h2 className="text-sm font-semibold text-foreground">
            Scheduled Classes
          </h2>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  status === tab.value
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-card-hover"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingSessions ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-border bg-card-hover"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No {status === "ALL" ? "" : status.toLowerCase()} classes
              scheduled yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(s.scheduledAt)}
                      {s.scheduledEndAt
                        ? ` — ${new Date(s.scheduledEndAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          s.targetFieldId
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {s.field ? `${s.field.name} field only` : "All interns"}
                      </span>
                      {s.joinUrl && (
                        <a
                          href={s.joinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-medium text-primary hover:underline"
                        >
                          Join link
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="rounded-md border border-danger/20 p-1.5 text-danger hover:bg-danger/10 transition-colors"
                    title="Delete class"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Class?"
        description="This class will be removed. Interns will not be notified of the deletion."
        variant="danger"
        confirmLabel="Yes, Delete"
        confirmLoading={deleteSessionMutation.isPending}
      />
    </div>
  );
}
