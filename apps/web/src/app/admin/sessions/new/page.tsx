"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconFileText,
  IconUpload,
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
import ScheduleSessionForm from "../_components/ScheduleSessionForm";

interface Batch {
  id: string;
  name: string;
}

export default function ScheduleSessionPage() {
  usePageTitle("New Session");
  const router = useRouter();

  const [selectedBatchId, setSelectedBatchId] = useState("");
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

      {/* Session Details Card */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Session Details
        </h2>
        <ScheduleSessionForm
          onSuccess={() => {
            router.push("/admin/sessions");
            router.refresh();
          }}
          onCancel={() => router.push("/admin/sessions")}
        />
      </div>

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
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
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
            <span className="text-sm text-foreground">{excelFile.name}</span>
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
