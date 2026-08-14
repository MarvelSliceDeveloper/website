"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconCalendar,
  IconVideo,
  IconUsersGroup,
  IconBook,
  IconUpload,
  IconFileText,
  IconDownload,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Batch {
  id: string;
  name: string;
  courseId: string | null;
  course: { id: string; title: string } | null;
  instructor: { id: string; name: string } | null;
  package: { id: string; name: string } | null;
}

interface Module {
  id: string;
  title: string;
  order: number;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ScheduleSessionPage() {
  usePageTitle("New Session");
  const router = useRouter();

  // Form state
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [form, setForm] = useState({
    moduleId: "",
    title: "",
    startDateTime: "",
    endDateTime: "",
    customJoinUrl: "",
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [copiedBatchId, setCopiedBatchId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const batchesQuery = useApiQuery<{ batches: Batch[] }>(
    ["admin", "sessions", "batches"],
    "/api/admin/batches",
    { limit: "500" },
  );
  const batches = batchesQuery.data?.batches ?? [];
  const loadingBatches = batchesQuery.isPending;

  const instructorsQuery = useApiQuery<Instructor[]>(
    ["admin", "sessions", "instructors"],
    "/api/admin/batches/instructors",
  );
  const instructors = instructorsQuery.data ?? [];
  const loadingInstructors = instructorsQuery.isPending;

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const courseId = selectedBatch?.courseId ?? null;

  const modulesQuery = useApiQuery<{ modules: Module[] }>(
    ["admin", "sessions", "modules", courseId ?? ""],
    courseId ? `/api/admin/courses/${courseId}` : "",
    undefined,
    { enabled: Boolean(courseId) },
  );
  const modules = modulesQuery.data?.modules ?? [];
  const loadingModules = modulesQuery.isPending;

  // Reset the linked module whenever the batch's course changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, moduleId: "" }));
  }, [courseId]);

  const copyBatchId = async (batchId: string) => {
    if (!batchId) {
      toast.error("Select a batch first");
      return;
    }
    try {
      await navigator.clipboard.writeText(batchId);
      setCopiedBatchId(batchId);
      toast.success("Batch ID copied to clipboard");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedBatchId(null), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = batchId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedBatchId(batchId);
      toast.success("Batch ID copied to clipboard");
    }
  };

  const defaultInstructorId = selectedBatch?.instructor?.id || "";

  const effectiveInstructorId =
    selectedInstructorId || defaultInstructorId;

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const scheduleMutation = useMutation({
    mutationFn: (payload: {
      batchId: string;
      courseId?: string;
      moduleId?: string;
      title: string;
      startDateTime: string;
      endDateTime: string;
      customJoinUrl?: string;
      instructorOverride?: string;
    }) => api.post("/api/sessions", payload),
    onSuccess: () => {
      toast.success("Session scheduled successfully!");
      router.push("/admin/sessions");
      router.refresh();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    if (!selectedBatchId) {
      toast.error("Please select a Batch");
      return;
    }

    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);

    if (start >= end) {
      toast.error("End time must be after the start time.");
      return;
    }

    if (start < new Date()) {
      toast.error("Start time cannot be in the past.");
      return;
    }

    scheduleMutation.mutate({
      batchId: selectedBatchId,
      courseId: selectedBatch?.courseId || undefined,
      moduleId: form.moduleId || undefined,
      title: form.title,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      customJoinUrl: form.customJoinUrl || undefined,
      instructorOverride:
        effectiveInstructorId &&
        effectiveInstructorId !== defaultInstructorId
          ? effectiveInstructorId
          : undefined,
    });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<{
        created: number;
        errors: string[];
      }>("/api/sessions/bulk-upload", formData);
    },
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((e: string) => toast.error(e));
      }
      toast.success(`${result.created} session(s) created successfully!`);
      router.push("/admin/sessions");
      router.refresh();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleExcelUpload = () => {
    if (!excelFile) {
      toast.error("Please select an Excel file");
      return;
    }
    uploadMutation.mutate(excelFile);
  };

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Schedule Session"
        description="Select a batch first, then set the date/time and instructor."
        breadcrumbs={[
          { label: "Sessions", href: "/admin/sessions" },
          { label: "Schedule", href: "/admin/sessions/new" },
        ]}
        action={
          <Link
            href="/admin/sessions"
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Details Card */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Session Details
          </h2>

          {/* Batch Selector — FIRST */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <IconUsersGroup size={16} />
              Select Batch <span className="text-danger">*</span>
            </label>
            {loadingBatches ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : (
              <Select
                value={selectedBatchId}
                onValueChange={(v) => {
                  setSelectedBatchId(v);
                  setForm((prev) => ({ ...prev, moduleId: "" }));
                  setSelectedInstructorId("");
                }}
              >
                <SelectTrigger className="field w-full">
                  <SelectValue placeholder="-- Choose a Batch --" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} —{" "}
                      {batch.course?.title ??
                        (batch.package?.name ? `${batch.package.name} Package` : "N/A")}
                      {batch.instructor
                        ? ` (Instructor: ${batch.instructor.name})`
                        : " (No instructor)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!loadingBatches && batches.length === 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-xs text-warning mt-2">
                No batches found. Please create a batch first.
              </div>
            )}
          </div>

          {/* Course Info (display only, derived from batch) */}
          {selectedBatch && (
            <div className="rounded-lg bg-card/50 p-3">
              <div className="flex text-sm">
                <span className="text-muted min-w-[100px]">Course</span>
                <span className="text-foreground font-medium">
                  {selectedBatch.course?.title ??
                    selectedBatch.package?.name ??
                    "Not linked to a specific course"}
                </span>
              </div>
              {selectedBatch.course && (
                <div className="flex text-sm mt-1">
                  <span className="text-muted min-w-[100px]">Instructor</span>
                  <span className="text-foreground">
                    {selectedBatch.instructor?.name ?? "Not assigned"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Instructor Override */}
          {selectedBatchId && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <IconUsersGroup size={16} className="text-primary" />
                Session Instructor
              </label>
              {loadingInstructors ? (
                <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
              ) : (
                <Select
                  value={selectedInstructorId || "__default__"}
                  onValueChange={setSelectedInstructorId}
                >
                  <SelectTrigger className="field w-full">
                    <SelectValue placeholder="— Use batch instructor (default) —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">
                      — Use batch instructor (default) —
                    </SelectItem>
                    {instructors.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name} ({inst.email})
                        {inst.role === "ADMIN"
                          ? " 🛡️ Admin"
                          : inst.role === "SUPER_ADMIN"
                            ? " 🛡️ Super Admin"
                            : " 👨‍🏫 Instructor"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="mt-1 text-xs text-muted">
                Optional. Override the batch&apos;s default instructor.
              </p>
            </div>
          )}

          {/* Module Selector (only when batch has a course) */}
          {selectedBatchId && selectedBatch?.course && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <IconBook size={16} className="text-accent" />
                Link to Module
              </label>
              {loadingModules ? (
                <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
              ) : (
                <Select
                  value={form.moduleId}
                  onValueChange={(v) => update("moduleId", v)}
                >
                  <SelectTrigger className="field w-full">
                    <SelectValue placeholder="-- General / Introductory Session (no module) --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      -- General / Introductory Session (no module) --
                    </SelectItem>
                    {modules.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id}>
                        Module {mod.order}: {mod.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="mt-1 text-xs text-muted">
                Optional. Link this session to a specific course module.
              </p>
            </div>
          )}

          {/* Session Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Session Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Session 1: Orientation & Setup"
              className="field w-full"
              required
              minLength={3}
              maxLength={200}
              disabled={!selectedBatchId}
            />
          </div>

          {/* Start & End Times */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <IconCalendar size={16} className="text-primary" />
                Start Date & Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startDateTime}
                onChange={(e) => update("startDateTime", e.target.value)}
                className="field w-full"
                required
                disabled={!selectedBatchId}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <IconCalendar size={16} className="text-danger" />
                End Date & Time <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endDateTime}
                onChange={(e) => update("endDateTime", e.target.value)}
                className="field w-full"
                required
                disabled={!selectedBatchId}
              />
            </div>
          </div>

          {/* Custom Join URL */}
          {selectedBatchId && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <IconVideo size={16} className="text-primary" />
                Custom Join URL <span className="text-muted">(Optional)</span>
              </label>
              <input
                type="url"
                value={form.customJoinUrl}
                onChange={(e) => update("customJoinUrl", e.target.value)}
                placeholder="e.g. https://teams.microsoft.com/l/meetup-join/... or Google Meet URL"
                className="field w-full"
                disabled={!selectedBatchId}
              />
              <p className="mt-1 text-xs text-muted">
                Paste a Google Meet, Zoom, or Teams link here. Leave blank to
                auto-create a Teams meeting via Microsoft Graph (requires a
                Teams license).
              </p>
            </div>
          )}

          {/* Teams Notice */}
          {selectedBatchId && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground flex gap-3 items-start">
              <IconVideo size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-0.5">
                  Meeting Link
                </p>
                <p>
                  Provide a Custom Join URL above (Google Meet, Zoom, etc.) — or
                  leave it blank to auto-create a Teams meeting via Microsoft
                  Graph (requires a Teams license). Students receive the link in
                  their dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/sessions"
            className="btn-secondary text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={
              scheduleMutation.isPending || !selectedBatchId || !form.title
            }
          >
            {scheduleMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Scheduling...
              </>
            ) : (
              <>
                <IconCalendar size={16} />
                Schedule Session
              </>
            )}
          </button>
        </div>
      </form>

      {/* Excel Upload Section */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <IconFileText size={16} />
          Bulk Upload Sessions
        </h2>
        <p className="text-xs text-muted">
          Upload an Excel (.xlsx) file to create multiple sessions at once.
          Required columns: <strong>batchId</strong>, <strong>title</strong>,
          <strong>startDateTime</strong>, <strong>endDateTime</strong>
          <br />
          Optional columns: <strong>moduleId</strong>,{" "}
          <strong>customJoinUrl</strong>, <strong>instructorOverride</strong>
        </p>

        {/* Copy Batch ID helper — Excel requires the batchId column */}
        {!loadingBatches && batches.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <IconCopy size={14} className="text-primary" />
              Copy a Batch ID
              <span className="font-normal text-muted">
                — paste it into the <strong>batchId</strong> column
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => copyBatchId(selectedBatchId)}
                disabled={!selectedBatchId}
                className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {copiedBatchId === selectedBatchId ? (
                  <>
                    <IconCheck size={14} className="text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <IconCopy size={14} />
                    {selectedBatchId ? "Copy" : "Select a batch"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="btn-secondary text-sm flex items-center gap-2 cursor-pointer">
            <IconUpload size={14} />
            Choose File
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          {excelFile && (
            <span className="text-sm text-foreground">
              {excelFile.name}
            </span>
          )}
        </div>

        <div className="border border-dashed border-border rounded-lg p-4 bg-card/50">
          <p className="text-xs text-muted mb-2">
            Tip: Download a template file to get started quickly.
          </p>
          <div className="flex gap-4 text-xs">
            <a
              href="/templates/session-bulk-template.csv"
              download="session-bulk-template.csv"
              className="text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <IconDownload size={12} />
              Download CSV Template
            </a>
            <a
              href="/api/sessions/template"
              download="sessions-template.xlsx"
              className="text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <IconDownload size={12} />
              Download Excel Template
            </a>
          </div>
        </div>

        <button
          onClick={handleExcelUpload}
          className="btn-primary text-sm flex items-center gap-2"
          disabled={uploadMutation.isPending || !excelFile}
        >
          {uploadMutation.isPending
            ? "Uploading..."
            : "Upload & Create Sessions"}
        </button>
      </div>
    </div>
  );
}