"use client";

import { useState, useRef, Fragment } from "react";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconUpload,
  IconFile,
  IconX,
  IconExternalLink,
} from "@tabler/icons-react";
import type { OverdueAssignment } from "@/lib/api-types";
import type { ViewState } from "../_types/student-portal";

interface AssignmentOverdueViewProps {
  assignments: OverdueAssignment[];
  navigate?: (v: ViewState) => void;
}

export default function AssignmentOverdueView({
  assignments,
  navigate,
}: AssignmentOverdueViewProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<string[]>([]);
  const [listFilter, setListFilter] = useState<"all" | "pending" | "completed">(
    "all",
  );

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

  const allItems = [...overdueItems, ...completedItems];
  const filteredItems =
    listFilter === "all"
      ? allItems
      : listFilter === "pending"
        ? overdueItems
        : completedItems;

  function handleOpenUpload(assignmentId: string) {
    setActiveUploadId(assignmentId);
    setSelectedFile(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      <div>
        <p className="sp-eyebrow">Tasks</p>
        <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your completed assignment files before the deadline.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.zip,.rar,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />

      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        {(["all", "pending", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setListFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              listFilter === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "all" && `All (${allItems.length})`}
            {tab === "pending" && `Pending (${overdueItems.length})`}
            {tab === "completed" && `Completed (${completedItems.length})`}
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="glass-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-card-hover">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assignment Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Course
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Module
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((assignment) => {
                  const isPending = assignment.status === "PENDING";
                  const daysOverdue = isPending
                    ? Math.floor(
                        (new Date().getTime() -
                          new Date(assignment.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 0;
                  const isOverdue = daysOverdue > 0;
                  const isActive = activeUploadId === assignment.id;

                  return (
                    <Fragment key={assignment.id}>
                      <tr className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500/15">
                              <IconFile size={13} className="text-blue-500" />
                            </span>
                            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {assignment.assignmentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {assignment.courseName}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {assignment.moduleName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <IconClock
                              size={13}
                              className={
                                isOverdue
                                  ? "text-danger"
                                  : isPending
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                              }
                            />
                            <span
                              className={`text-xs font-medium ${
                                isOverdue
                                  ? "text-danger"
                                  : isPending
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                              }`}
                            >
                              {isPending
                                ? isOverdue
                                  ? `${daysOverdue}d overdue`
                                  : new Date(
                                      assignment.dueDate,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                              <IconCheck size={11} /> Submitted
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {assignment.courseId && navigate && (
                              <button
                                onClick={() =>
                                  navigate({
                                    view: "COURSE_CONTENT",
                                    params: {
                                      courseId: assignment.courseId,
                                      assignmentId: assignment.id,
                                    },
                                  })
                                }
                                className="btn-ghost text-xs px-2 py-1.5"
                                title="View in Course"
                              >
                                <IconExternalLink size={13} />
                              </button>
                            )}
                            {isPending ? (
                              <button
                                onClick={() =>
                                  isActive
                                    ? (setActiveUploadId(null),
                                      setSelectedFile(null))
                                    : handleOpenUpload(assignment.id)
                                }
                                className="btn-primary text-xs px-3 py-1.5"
                              >
                                <IconUpload size={13} className="inline mr-1" />
                                {isActive ? "Cancel" : "Submit"}
                              </button>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-400">
                                Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isPending && isActive && (
                        <tr key={`${assignment.id}-upload`}>
                          <td
                            colSpan={6}
                            className="px-4 py-3 bg-card-hover/50"
                          >
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
                                  onClick={() =>
                                    handleSubmitFile(assignment.id)
                                  }
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-3 font-semibold text-foreground">
            {listFilter === "all"
              ? "No assignments yet"
              : listFilter === "pending"
                ? "No pending assignments"
                : "No completed assignments yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {listFilter === "all"
              ? "You're all caught up! Keep up the great work."
              : listFilter === "pending"
                ? "You're all caught up!"
                : "Submit an assignment to see it here."}
          </p>
        </div>
      )}
    </div>
  );
}
