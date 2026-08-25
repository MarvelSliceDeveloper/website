"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { toast, getErrorMessage } from "@/lib/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconFileZip, IconX, IconSparkles } from "@tabler/icons-react";
import { useAIGenerate } from "@/lib/use-ai-generate";

type TargetType =
  | "ALL_USERS"
  | "BATCH"
  | "COURSE"
  | "INTERN"
  | "INTERN_FIELD"
  | "INSTRUCTORS"
  | "STUDENTS";
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
  body?: string;
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
  const [channel, setChannel] = useState<"IN_APP" | "EMAIL" | "BOTH">("BOTH");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [confirmShow, setConfirmShow] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // AI draft generation
  const [aiBrief, setAiBrief] = useState("");
  const aiGenerate = useAIGenerate<{ title: string; message: string }>();

  function handleAiDraft() {
    if (!aiBrief.trim()) {
      toast.error("Describe what the notification should say first");
      return;
    }
    aiGenerate.mutate(
      { type: "NOTIFICATION", prompt: aiBrief.trim() },
      {
        onSuccess: (res) => {
          if (res.data.title) setTitle(res.data.title);
          if (res.data.message) setMessage(res.data.message);
          toast.success("Notification drafted — review before sending");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  }

  const coursesQuery = useApiQuery<CourseOption[]>(
    ["admin", "notifications", "courses"],
    "/api/admin/batches/courses",
  );
  const courses = coursesQuery.data ?? [];

  const batchesQuery = useApiQuery<{ batches: BatchOption[] }>(
    ["admin", "notifications", "batches"],
    "/api/admin/batches",
  );
  const batches = batchesQuery.data?.batches ?? [];

  const emailTemplatesQuery = useApiQuery<
    EmailTemplateOption[] | { templates: EmailTemplateOption[] }
  >(
    ["admin", "notifications", "email-templates"],
    "/api/admin/email-templates",
  );
  const emailTemplates = Array.isArray(emailTemplatesQuery.data)
    ? emailTemplatesQuery.data
    : (emailTemplatesQuery.data?.templates ?? []);

  const internFieldsQuery = useApiQuery<{ fields: InternFieldOption[] }>(
    ["admin", "notifications", "intern-fields"],
    "/api/admin/interns/fields",
  );
  const internFields = internFieldsQuery.data?.fields ?? [];

  const filteredBatches =
    targetType === "COURSE" && selectedCourseIds.size > 0
      ? batches.filter((b) => b.course && selectedCourseIds.has(b.course.id))
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

  type SendPayload = {
    targetType: TargetType;
    targetIds: string[];
    title: string;
    message: string;
    channel: "IN_APP" | "EMAIL" | "BOTH";
    emailTemplateId?: string;
  };

  const sendMutation = useMutation({
    mutationFn: ({
      payload,
      attachment,
    }: {
      payload: SendPayload;
      attachment: File | null;
    }) =>
      api.post<{ message: string; count: number }>(
        "/api/notifications/send",
        attachment ? toFormData(payload, attachment) : payload,
      ),
    onSuccess: (res) => {
      toast.success(res.message || `Sent to ${res.count} users`);
      setTitle("");
      setMessage("");
      setAttachment(null);
      setSelectedBatchIds(new Set());
      setSelectedCourseIds(new Set());
      setSelectedInternFieldIds(new Set());
      setConfirmShow(false);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleSend() {
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
      targetType !== "INSTRUCTORS" &&
      targetType !== "STUDENTS" &&
      targetIds.length === 0
    ) {
      toast.error("Select at least one target");
      return;
    }

    const payload: SendPayload = {
      targetType,
      targetIds,
      title: title.trim(),
      message: message.trim(),
      channel,
      ...(selectedTemplateId ? { emailTemplateId: selectedTemplateId } : {}),
    };

    sendMutation.mutate({ payload, attachment });
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
      case "INSTRUCTORS":
        return "all instructors";
      case "STUDENTS":
        return "all students";
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

  const selectedTemplate = emailTemplates.find(
    (t) => t.id === selectedTemplateId,
  );
  const previewSubject = (selectedTemplate?.subject ?? "New Notification")
    .replaceAll("{{notificationTitle}}", title.trim() || "Notification Title")
    .replaceAll(
      "{{notificationMessage}}",
      message.trim() || "Notification message",
    );

  const previewHtml = selectedTemplate?.body
    ? selectedTemplate.body
        .replaceAll(
          "{{notificationTitle}}",
          title.trim() || "Notification Title",
        )
        .replaceAll(
          "{{notificationMessage}}",
          message.trim() || "Notification message",
        )
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass-card space-y-5 p-6 lg:col-span-3">
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
                <SelectItem value="INSTRUCTORS">All Instructors</SelectItem>
                <SelectItem value="STUDENTS">All Students</SelectItem>
                <SelectItem value="BATCH">Specific Batches</SelectItem>
                <SelectItem value="COURSE">Specific Courses</SelectItem>
                <SelectItem value="INTERN">All Interns</SelectItem>
                <SelectItem value="INTERN_FIELD">Interns by Field</SelectItem>
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
                      {b.course && (
                        <span className="ml-2 text-xs text-muted">
                          {b.course.title}
                        </span>
                      )}
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

          {/* Delivery Channel */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Delivery
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "IN_APP", label: "In-app", hint: "Inbox only" },
                  { value: "EMAIL", label: "Email", hint: "Email only" },
                  { value: "BOTH", label: "Both", hint: "Inbox + email" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannel(opt.value)}
                  className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    channel === opt.value
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-card-hover/30 hover:border-border-hover"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      channel === opt.value
                        ? "text-primary-hover"
                        : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-muted">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attachment (ZIP / PDF) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Attachment{" "}
              <span className="text-xs text-muted">
                (optional — ZIP or PDF)
              </span>
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

          {/* AI draft */}
          <div className="space-y-2 rounded-xl border border-violet-300/50 bg-violet-500/5 p-3">
            <div className="flex items-center gap-2">
              <IconSparkles size={15} className="shrink-0 text-violet-500" />
              <p className="text-xs font-semibold text-foreground">
                Draft with AI
              </p>
            </div>
            <textarea
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              placeholder="Describe what to announce, e.g. Live class moved from Friday 5pm to Saturday 11am for the Data Science batch"
              className="field min-h-[60px] resize-y text-xs"
              maxLength={2000}
            />
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={aiGenerate.isPending}
              className="flex items-center gap-1 rounded-md border border-violet-300/60 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
            >
              {aiGenerate.isPending ? "Drafting…" : "Generate Draft"}
            </button>
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
              Email Template{" "}
              <span className="text-xs text-muted">(optional)</span>
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
              disabled={
                !title.trim() || !message.trim() || sendMutation.isPending
              }
              className="btn-primary"
            >
              {sendMutation.isPending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Live Email Preview */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-sm font-semibold text-foreground">
                Email Preview
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <div className="p-5">
              {selectedTemplate?.body ? (
                <div>
                  <iframe
                    title="Email template preview"
                    srcDoc={previewHtml}
                    sandbox=""
                    className="min-h-[360px] w-full rounded-xl border border-border/60 bg-background/60"
                  />
                  <p className="mt-2 text-[10px] text-muted">
                    Live preview of &quot;{selectedTemplate.name}&quot; template
                    with real colors.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-background/60">
                  <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                      MS
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Marvel Slice
                      </p>
                      <p className="truncate text-[10px] text-muted">
                        to {targetSummary()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Subject
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {previewSubject}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Title
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-primary">
                        {title.trim() || "(Notification title)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Message
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {message.trim() || "(Notification message)"}
                      </p>
                    </div>
                    {attachment && (
                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2">
                        <IconFileZip
                          size={14}
                          className="shrink-0 text-primary"
                        />
                        <span className="truncate text-xs font-medium text-foreground">
                          {attachment.name}
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                disabled={sendMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="btn-primary"
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? "Sending..." : "Yes, Send"}
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
    fd.append(
      key,
      Array.isArray(value) ? JSON.stringify(value) : String(value),
    );
  }
  return fd;
}
