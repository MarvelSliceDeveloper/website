"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BatchOption = {
  id: string;
  name: string;
  course: { id: string; title: string } | null;
};
type EmailTemplateOption = {
  id: string;
  name: string;
  subject: string;
};

export default function InstructorSendNotificationPage() {
  usePageTitle("Send Notification");
  const router = useRouter();

  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateOption[]>(
    [],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    api
      .get<{ batches: BatchOption[] }>("/api/admin/batches")
      .then((res) => setBatches(res.batches ?? []))
      .catch(() => {});
    api
      .get<EmailTemplateOption[]>("/api/admin/email-templates")
      .then(setEmailTemplates)
      .catch(() => {});
  }, []);

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (selectedBatchIds.size === 0) {
      toast.error("Select at least one batch");
      return;
    }

    setSending(true);
    try {
      const res = await api.post<{ message: string; count: number }>(
        "/api/notifications/send",
        {
          targetType: "BATCH",
          targetIds: Array.from(selectedBatchIds),
          title: title.trim(),
          message: message.trim(),
          ...(selectedTemplateId
            ? { emailTemplateId: selectedTemplateId }
            : {}),
        },
      );
      toast.success(res.message || `Sent to ${res.count} users`);
      setTitle("");
      setMessage("");
      setSelectedBatchIds(new Set());
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader
        title="Send Notification"
        breadcrumbs={[
          {
            label: "Send Notification",
            href: "/instructor/notifications/send",
          },
        ]}
        role="Instructor"
        description="Send a custom notification to students in your batches."
      />

      <div className="glass-card space-y-5 p-6">
        {/* Target type (locked to BATCH) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Target Audience
          </label>
          <input
            type="text"
            value="Your Assigned Batches"
            disabled
            className="field text-muted-foreground"
          />
        </div>

        {/* Batch multi-select */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Select Batches <span className="text-danger">*</span>
          </label>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
            {batches.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">
                No batches assigned to you
              </p>
            )}
            {batches.map((b) => (
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
                    {b.course?.title ?? "No course"}
                  </span>
                </span>
              </label>
            ))}
          </div>
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
            placeholder="e.g. Assignment Reminder"
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
              This will send &quot;{title.trim()}&quot; to students in{" "}
              {selectedBatchIds.size} batch(es). Are you sure?
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
