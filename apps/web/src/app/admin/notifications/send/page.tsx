"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { toast } from "@/lib/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconFileZip, IconX } from "@tabler/icons-react";

type TargetType =
  | "ALL_USERS"
  | "BATCH"
  | "COURSE"
  | "INTERN"
  | "INTERN_FIELD";
type CourseOption = { id: string; title: string };
type BatchOption = {
  id: string;
  name: string;
  course: { id: string; title: string };
};
type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
};
type InternFieldOption = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { interns: number };
};

export default function AdminSendNotificationPage() {
  usePageTitle("Send Notification");
  const router = useRouter();

  const [targetType, setTargetType] = useState<TargetType>("ALL_USERS");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [internFields, setInternFields] = useState<InternFieldOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedInternFieldIds, setSelectedInternFieldIds] = useState<
    Set<string>
  >(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState<
    EmailTemplateOption[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    api
      .get<CourseOption[]>("/api/admin/batches/courses")
      .then(setCourses)
      .catch(() => {});
    api
      .get<{ batches: BatchOption[] }>("/api/admin/batches")
      .then((data) => setBatches(data.batches))
      .catch(() => {});
    api
      .get<EmailTemplateOption[] | { templates: EmailTemplateOption[] }>("/api/admin/email-templates")
      .then((res) => setEmailTemplates(Array.isArray(res) ? res : res.templates ?? []))
      .catch(() => {});
    api
      .get<{ fields: InternFieldOption[] }>("/api/admin/interns/fields")
      .then((res) => setInternFields(res.fields ?? []))
      .catch(() => {});
  }, []);

  const filteredBatches =
    targetType === "COURSE" && selectedCourseIds.size > 0
      ? batches.filter((b) => selectedCourseIds.has(b.course.id))
      : batches;

  const activeInternFields = internFields.filter((f) => f.isActive);

  function buildTargetIds(): string[] {
    switch (targetType) {
      case "BATCH":
        return Array.from(selectedBatchIds);
      case "COURSE":
        return Array.from(selectedCourseIds);
      case "INTERN_FIELD":
        return Array.from(selectedInternFieldIds);
      default:
        return [];
    }
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (attachment && !/\.(zip|pdf)$/i.test(attachment.name)) {
      toast.error("Attachment must be a ZIP or PDF file");
      return;
    }

    const targetIds = buildTargetIds();
    if (
      targetType !== "ALL_USERS" &&
      targetType !== "INTERN" &&
      targetIds.length === 0
    ) {
      toast.error("Select at least one target");
      return;
    }

    setSending(true);
    try {
      const payload = {
        targetType,
        targetIds,
        title: title.trim(),
        message: message.trim(),
        ...(selectedTemplateId ? { emailTemplateId: selectedTemplateId } : {}),
      };

      const res = await api.post<{ message: string; count: number }>(
        "/api/notifications/send",
        attachment ? toFormData(payload, attachment) : payload,
      );
      toast.success(res.message || `Sent to ${res.count} users`);
      setTitle("");
      setMessage("");
      setAttachment(null);
      setSelectedBatchIds(new Set());
      setSelectedCourseIds(new Set());
      setSelectedInternFieldIds(new Set());
      setConfirmShow(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send notification",
      );
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

  function toggleInternField(id: string) {
    setSelectedInternFieldIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onTargetChange(v: string) {
    setTargetType(v as TargetType);
    setSelectedBatchIds(new Set());
    setSelectedCourseIds(new Set());
    setSelectedInternFieldIds(new Set());
  }

  function targetSummary(): string {
    switch (targetType) {
      case "ALL_USERS":
        return "all users";
      case "INTERN":
        return "all interns";
      case "BATCH":
        return `${selectedBatchIds.size} batch(es)`;
      case "COURSE":
        return `${selectedCourseIds.size} course(s)`;
      case "INTERN_FIELD":
        return `interns in ${selectedInternFieldIds.size} field(s)`;
    }
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
          Send a custom message to all users, batches, courses, or interns.
        </p>
      </div>

      <div className="glass-card space-y-5 p-6">
        {/* Target Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Target Audience <span className="text-danger">*</span>
          </label>
          <Select value={targetType} onValueChange={onTargetChange}>
            <SelectTrigger className="field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_USERS">All Users</SelectItem>
              <SelectItem value="BATCH">Specific Batches</SelectItem>
              <SelectItem value="COURSE">Specific Courses</SelectItem>
              <SelectItem value="INTERN">All Interns</SelectItem>
              <SelectItem value="INTERN_FIELD">
                Interns by Field
              </SelectItem>
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

        {/* Intern field multi-select */}
        {targetType === "INTERN_FIELD" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Fields (Interns) <span className="text-danger">*</span>
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
              {activeInternFields.length === 0 && (
                <p className="py-4 text-center text-sm text-muted">
                  No internship fields configured yet.
                </p>
              )}
              {activeInternFields.map((f) => (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedInternFieldIds.has(f.id)
                      ? "bg-primary/10 text-primary-hover"
                      : "text-foreground hover:bg-card-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInternFieldIds.has(f.id)}
                    onChange={() => toggleInternField(f.id)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="flex-1">
                    {f.name}
                    <span className="ml-2 text-xs text-muted">
                      {f._count.interns} intern(s)
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Attachment (ZIP / PDF) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Attachment{" "}
            <span className="text-xs text-muted">(optional — ZIP or PDF)</span>
          </label>
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card-hover/30 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <IconFileZip size={18} className="shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {attachment.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {(attachment.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                aria-label="Remove attachment"
              >
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".zip,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && !/\.(zip|pdf)$/i.test(file.name)) {
                  toast.error("Only ZIP or PDF files are allowed");
                  e.target.value = "";
                  return;
                }
                setAttachment(file);
              }}
              className="field file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-hover"
            />
          )}
          <p className="mt-1 text-xs text-muted">
            Up to 25 MB. Recipients receive the file with the notification
            email.
          </p>
        </div>

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

        {/* Email Template selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email Template <span className="text-xs text-muted">(optional)</span>
          </label>
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
          >
            <SelectTrigger className="field">
              <SelectValue placeholder="Default template (no selection)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Default template</SelectItem>
              {emailTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateId && (
            <div className="mt-2 rounded-lg border border-border/60 bg-card-hover/30 px-3 py-2">
              <p className="text-xs text-muted">
                Subject:{" "}
                <span className="font-medium text-foreground">
                  {emailTemplates.find((t) => t.id === selectedTemplateId)
                    ?.subject ?? ""}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Uses{" "}
                <code className="rounded bg-border/40 px-1">
                  {`{{notificationTitle}}`}
                </code>{" "}
                and{" "}
                <code className="rounded bg-border/40 px-1">
                  {`{{notificationMessage}}`}
                </code>{" "}
                placeholders
              </p>
            </div>
          )}
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
              This will send &quot;{title.trim()}&quot; to {targetSummary()}.
              {attachment
                ? ` It includes the attachment “${attachment.name}”.`
                : ""}{" "}
              Are you sure?
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

function toFormData(
  payload: Record<string, unknown>,
  attachment: File,
): FormData {
  const fd = new FormData();
  fd.append("attachment", attachment);
  for (const [key, value] of Object.entries(payload)) {
    fd.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
  }
  return fd;
}
