"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IconFileSpreadsheet,
  IconFileDownload,
  IconX,
  IconDownload,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "@/lib/toast";
import { AssignmentInfo } from "./types";
import {
  getDrivePreviewUrl,
  getDriveDownloadUrl,
  isExternalUrl,
} from "@/lib/drive";

interface AssignmentContentProps {
  assignment: AssignmentInfo;
  moduleName: string | null;
  onBack: () => void;
}

interface DownloadState {
  progress: number;
  error: string | null;
  done: boolean;
  filename: string;
}

function downloadTarget(url: string): string {
  return getDriveDownloadUrl(url);
}

async function downloadFile(
  originalUrl: string,
  onProgress: (percent: number) => void,
): Promise<{ blob: Blob; filename: string }> {
  const isExternal = isExternalUrl(originalUrl);
  const target = isExternal
    ? `/api/assignments/download-proxy?url=${encodeURIComponent(originalUrl)}`
    : originalUrl;

  const response = await fetch(target, { credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body.error === "string"
        ? body.error
        : `Download failed (${response.status})`;
    throw new Error(message);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  const contentType =
    response.headers.get("content-type") || "application/octet-stream";

  if (contentType.includes("text/html")) {
    throw new Error(
      "This file can't be downloaded directly. Open it in Google Drive instead.",
    );
  }

  const dispositionFilename = response.headers.get("x-download-filename");
  let filename = "";
  if (dispositionFilename) {
    try {
      filename = decodeURIComponent(dispositionFilename);
    } catch {
      filename = dispositionFilename;
    }
  }
  if (!filename) {
    const pathname = originalUrl.split("?")[0];
    const segment = pathname.split("/").filter(Boolean).pop();
    filename = segment || "assignment-question";
  }
  if (!/\.\w{2,5}$/i.test(filename)) {
    const ext = contentType.includes("pdf") ? ".pdf" : "";
    filename = `${filename}${ext}`;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Download failed: no data received");

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (contentLength > 0) {
        onProgress(Math.round((received / contentLength) * 100));
      }
    }
  }

  const blob = new Blob(chunks as BlobPart[], { type: contentType });
  return { blob, filename };
}

export default function AssignmentContent({
  assignment,
  moduleName,
  onBack,
}: AssignmentContentProps) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [download, setDownload] = useState<DownloadState | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const questionPdfUrl = assignment.questionPdfUrl;
  const previewUrl = questionPdfUrl ? getDrivePreviewUrl(questionPdfUrl) : null;

  async function handleDownload() {
    if (!questionPdfUrl) return;
    setDownloading(true);
    setDownload({ progress: 0, error: null, done: false, filename: "" });
    try {
      const { blob, filename } = await downloadFile(
        downloadTarget(questionPdfUrl),
        (percent) => setDownload((d) => (d ? { ...d, progress: percent } : d)),
      );
      setDownload((d) => ({
        progress: 100,
        error: null,
        done: true,
        filename: d?.filename || filename,
      }));
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      toast.success(`Downloaded ${filename}`);
      window.setTimeout(() => setDownloading(false), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed";
      setDownload((d) => ({ ...(d as DownloadState), error: message }));
    }
  }

  return (
    <div className="space-y-6">
      {questionPdfUrl ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              Question Paper
            </span>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <IconFileDownload size={14} />
              Download PDF
            </button>
          </div>
          <iframe
            src={previewUrl || ""}
            className="w-full h-[calc(100vh-var(--shell-header-height,56px)-250px)] min-h-[420px] bg-white"
            title="Assignment Question PDF"
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center">
          <IconFileSpreadsheet size={40} className="text-blue-500/60" />
          <p className="text-sm text-muted-foreground max-w-md">
            No question paper attached to this assignment.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <IconFileSpreadsheet size={18} className="text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Assignment
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground mt-1">
          {assignment.title}
        </h2>
        {moduleName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Module: {moduleName}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>
            Due:{" "}
            {assignment.dueDate
              ? new Date(assignment.dueDate).toLocaleDateString("en-IN")
              : "No due date"}
          </span>
          <span>Type: {assignment.type}</span>
        </div>
      </div>

      {mounted &&
        downloading &&
        download &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Downloading question paper"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border/90 bg-card p-6 shadow-2xl shadow-black/20 animate-in fade-in zoom-in-95 duration-200">
              {download.error ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                      <IconX size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Download failed
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {download.error}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setDownloading(false)}
                      className="btn-secondary text-xs font-semibold px-4 py-2"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDownload}
                      className="btn-primary text-xs font-semibold px-4 py-2"
                    >
                      Retry
                    </button>
                  </div>
                </>
              ) : download.done ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <IconCheck size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Download complete
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {download.filename || "File downloaded"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IconDownload size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Downloading question paper
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {download.filename || assignment.title}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-200"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right text-xs font-medium text-muted-foreground">
                      {download.progress}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
