"use client";

import { useState, useRef } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconUpload,
  IconFile,
  IconX,
} from "@tabler/icons-react";
import type { OverdueAssignment } from "@/lib/student-mock-data";

// ── Component Props ─────────────────────────────────────────────────────────

interface AssignmentOverdueViewProps {
  assignments: OverdueAssignment[];
}

export default function AssignmentOverdueView({
  assignments,
}: AssignmentOverdueViewProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep track of assignments submitted in this browser session
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<string[]>([]);

  const overdueItems = assignments.filter(
    (a) => a.status === "PENDING" && !locallySubmittedIds.includes(a.id),
  );
  const completedItems = [
    ...assignments.filter((a) => a.status === "SUBMITTED"),
    ...assignments
      .filter(
        (a) => a.status === "PENDING" && locallySubmittedIds.includes(a.id),
      )
      .map((a) => ({ ...a, status: "SUBMITTED" as const })),
  ];

  function handleOpenUpload(assignmentId: string) {
    setActiveUploadId(assignmentId);
    setSelectedFile(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 25 MB
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size must be less than 25 MB.");
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmitFile(assignmentId: string) {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("answerFile", selectedFile);

    try {
      setUploading(assignmentId);
      await api.post(`/api/assignments/${assignmentId}/submit/file`, formData);
      setLocallySubmittedIds((prev) => [...prev, assignmentId]);
      toast.success("Assignment submitted successfully!");
      setActiveUploadId(null);
      setSelectedFile(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="sp-view-enter space-y-6">
      {/* Header */}
      <div>
        <p className="sp-eyebrow">Tasks</p>
        <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your completed assignment files before the deadline.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.zip,.rar,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />

      {/* Overdue Section */}
      {overdueItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconAlertCircle size={20} className="text-danger" />
            <h2 className="text-lg font-semibold text-foreground">
              Pending ({overdueItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdueItems.map((assignment) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() -
                  new Date(assignment.dueDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              const isOverdue = daysOverdue > 0;
              const isActive = activeUploadId === assignment.id;

              return (
                <div
                  key={assignment.id}
                  className={`glass-card p-4 space-y-3 ${
                    isOverdue ? "border-danger/20" : "border-amber-500/20"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                          isOverdue
                            ? "border-danger/30 bg-danger/10"
                            : "border-amber-500/30 bg-amber-500/10"
                        }`}
                      >
                        <span className="text-lg">📄</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">
                          {assignment.assignmentName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {assignment.courseName}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <IconClock
                            size={14}
                            className={
                              isOverdue ? "text-danger" : "text-amber-400"
                            }
                          />
                          <span
                            className={`text-xs font-medium ${
                              isOverdue ? "text-danger" : "text-amber-400"
                            }`}
                          >
                            {isOverdue
                              ? `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
                              : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => handleOpenUpload(assignment.id)}
                        className="btn-primary flex-shrink-0 text-sm sm:w-auto flex items-center gap-1.5"
                      >
                        <IconUpload size={16} /> Upload File
                      </button>
                    )}
                  </div>

                  {/* Upload Area */}
                  {isActive && (
                    <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Upload Submission
                        </p>
                        <button
                          onClick={() => {
                            setActiveUploadId(null);
                            setSelectedFile(null);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconX size={16} />
                        </button>
                      </div>

                      {selectedFile ? (
                        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
                          <IconFile
                            size={20}
                            className="text-primary shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-muted-foreground hover:text-danger transition-colors"
                          >
                            <IconX size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-colors hover:bg-primary/10"
                        >
                          <IconUpload
                            size={24}
                            className="mx-auto text-primary mb-2"
                          />
                          <p className="text-sm font-medium text-foreground">
                            Click to select a file
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOCX, ZIP, images — max 25 MB
                          </p>
                        </button>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSubmitFile(assignment.id)}
                          disabled={
                            !selectedFile || uploading === assignment.id
                          }
                          className="btn-primary text-sm px-5 py-2"
                        >
                          {uploading === assignment.id
                            ? "Uploading..."
                            : "Submit Assignment"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completedItems.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <IconCheck size={20} className="text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              Completed ({completedItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completedItems.map((assignment) => (
              <div
                key={assignment.id}
                className="glass-card flex items-center justify-between border-success/20 p-4"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
                    <IconCheck size={18} className="text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {assignment.assignmentName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {assignment.courseName}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                  ✅ Submitted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {overdueItems.length === 0 && completedItems.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-3 font-semibold text-foreground">
            No assignments yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re all caught up! Keep up the great work.
          </p>
        </div>
      )}
    </div>
  );
}
