"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TargetType = "ALL_USERS" | "BATCH" | "COURSE";
type CourseOption = { id: string; title: string };
type BatchOption = {
  id: string;
  name: string;
  course: { id: string; title: string };
};

export default function AdminSendNotificationPage() {
  const router = useRouter();

  const [targetType, setTargetType] = useState<TargetType>("ALL_USERS");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);

  useEffect(() => {
    api
      .get<CourseOption[]>("/api/admin/batches/courses")
      .then(setCourses)
      .catch(() => {});
    api
      .get<BatchOption[]>("/api/admin/batches")
      .then(setBatches)
      .catch(() => {});
  }, []);

  const filteredBatches =
    targetType === "COURSE" && selectedCourseIds.size > 0
      ? batches.filter((b) => selectedCourseIds.has(b.course.id))
      : batches;

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    const targetIds =
      targetType === "ALL_USERS"
        ? []
        : targetType === "BATCH"
          ? Array.from(selectedBatchIds)
          : Array.from(selectedCourseIds);

    if (targetType !== "ALL_USERS" && targetIds.length === 0) {
      toast.error("Select at least one target");
      return;
    }

    setSending(true);
    try {
      const res = await api.post<{ message: string; count: number }>(
        "/api/notifications/send",
        {
          targetType,
          targetIds,
          title: title.trim(),
          message: message.trim(),
        },
      );
      toast.success(res.message || `Sent to ${res.count} users`);
      setTitle("");
      setMessage("");
      setSelectedBatchIds(new Set());
      setSelectedCourseIds(new Set());
      setConfirmShow(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCourse(id: string) {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Send Notification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a custom message to all users, specific batches, or entire
          courses.
        </p>
      </div>

      <div className="glass-card space-y-5 p-6">
        {/* Target Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Target Audience <span className="text-danger">*</span>
          </label>
          <Select
            value={targetType}
            onValueChange={(v) => {
              setTargetType(v as TargetType);
              setSelectedBatchIds(new Set());
              setSelectedCourseIds(new Set());
            }}
          >
            <SelectTrigger className="field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_USERS">All Users</SelectItem>
              <SelectItem value="BATCH">Specific Batches</SelectItem>
              <SelectItem value="COURSE">Specific Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course multi-select */}
        {targetType === "COURSE" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Courses <span className="text-danger">*</span>
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
              {courses.length === 0 && (
                <p className="py-4 text-center text-sm text-muted">
                  No published courses
                </p>
              )}
              {courses.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedCourseIds.has(c.id)
                      ? "bg-primary/10 text-primary-hover"
                      : "text-foreground hover:bg-card-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.has(c.id)}
                    onChange={() => toggleCourse(c.id)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  {c.title}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Batch multi-select */}
        {targetType === "BATCH" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Batches <span className="text-danger">*</span>
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
              {filteredBatches.length === 0 && (
                <p className="py-4 text-center text-sm text-muted">
                  No batches found
                </p>
              )}
              {filteredBatches.map((b) => (
                <label
                  key={b.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedBatchIds.has(b.id)
                      ? "bg-primary/10 text-primary-hover"
                      : "text-foreground hover:bg-card-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.has(b.id)}
                    onChange={() => toggleBatch(b.id)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="flex-1">
                    {b.name}
                    <span className="ml-2 text-xs text-muted">
                      {b.course.title}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Maintenance Downtime"
            className="field"
            maxLength={200}
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Message <span className="text-danger">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your notification message..."
            className="field min-h-[120px] resize-y"
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-muted">{message.length}/2000</p>
        </div>

        {/* Send button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmShow(true)}
            disabled={!title.trim() || !message.trim() || sending}
            className="btn-primary"
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Confirm Send</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will send &quot;{title.trim()}&quot; to{" "}
              {targetType === "ALL_USERS"
                ? "all users"
                : targetType === "BATCH"
                  ? `${selectedBatchIds.size} batch(es)`
                  : `${selectedCourseIds.size} course(s)`}
              . Are you sure?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmShow(false)}
                className="btn-secondary"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="btn-primary"
                disabled={sending}
              >
                {sending ? "Sending..." : "Yes, Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
