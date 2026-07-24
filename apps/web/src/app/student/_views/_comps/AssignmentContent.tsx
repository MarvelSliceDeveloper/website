"use client";

import { useState, useRef } from "react";
import {
  IconFileSpreadsheet,
  IconFileDownload,
  IconUpload,
  IconFile,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AssignmentInfo } from "./types";

interface AssignmentContentProps {
  assignment: AssignmentInfo;
  moduleName: string | null;
  onBack: () => void;
}

export default function AssignmentContent({
  assignment,
  moduleName,
  onBack,
}: AssignmentContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25 MB.");
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmitFile() {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("answerFile", selectedFile);
    try {
      setUploading(true);
      await api.post(`/api/assignments/${assignment.id}/submit/file`, formData);
      setIsSubmitted(true);
      toast.success("Assignment submitted successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
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
            Due: {new Date(assignment.dueDate).toLocaleDateString("en-IN")}
          </span>
          <span>Type: {assignment.type}</span>
          {isSubmitted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              <IconCheck size={12} /> Submitted
            </span>
          )}
        </div>
      </div>

      {assignment.questionPdfUrl ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              Question Paper
            </span>
            <a
              href={assignment.questionPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <IconFileDownload size={14} />
              Download PDF
            </a>
          </div>
          <iframe
            src={assignment.questionPdfUrl}
            className="w-full h-[60vh] bg-white"
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

      {/* Submission Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <IconUpload size={16} className="text-blue-500" />
          Submit Solution File (Code / Project Zip / Document)
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".py,.java,.cpp,.c,.js,.ts,.html,.css,.zip,.rar,.tar.gz,.pdf,.docx,.txt"
          onChange={handleFileSelect}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <IconFile size={24} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-muted-foreground hover:text-danger p-1 transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-all hover:bg-primary/10 hover:border-primary/50"
          >
            <IconUpload size={28} className="mx-auto text-primary mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Click to select programming file or ZIP package
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .py, .java, .cpp, .js, .ts, .zip, .pdf — max 25 MB
            </p>
          </button>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmitFile}
            disabled={!selectedFile || uploading}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
          >
            {uploading ? (
              "Uploading..."
            ) : isSubmitted ? (
              <>
                <IconCheck size={16} /> Resubmit Assignment
              </>
            ) : (
              "Submit Assignment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
