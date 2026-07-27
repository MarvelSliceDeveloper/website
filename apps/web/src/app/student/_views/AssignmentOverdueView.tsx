"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast, getErrorMessage } from "@/lib/toast";
import { api } from "@/lib/api";
import {
  IconCheck,
  IconClock,
  IconUpload,
  IconFile,
  IconX,
  IconExternalLink,
} from "@tabler/icons-react";
import RichEditor from "@/components/editor/RichEditor";
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
  const [comment, setComment] = useState("");
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<string[]>([]);
  const [listFilter, setListFilter] = useState<"all" | "pending" | "completed">(
    "all",
  );

  // Guards against SSR — document.body doesn't exist until we're mounted client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const modalAssignment = modalAssignmentId
    ? assignments.find((a) => a.id === modalAssignmentId)
    : null;

  function handleOpenModal(assignmentId: string) {
    setModalAssignmentId(assignmentId);
    setSelectedFile(null);
    setComment("");
  }

  function handleCloseModal() {
    setModalAssignmentId(null);
    setSelectedFile(null);
    setComment("");
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
    if (comment.trim()) {
      formData.append("comment", comment.trim());
    }
    try {
      setUploading(assignmentId);
      await api.post(`/api/assignments/${assignmentId}/submit/file`, formData);
      setLocallySubmittedIds((prev) => [...prev, assignmentId]);
      toast.success("Assignment submitted successfully!");
      handleCloseModal();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
      if (e.key === "Tab" && modalRef.current && modalAssignmentId) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [modalAssignmentId],
  );

  useEffect(() => {
    if (!modalAssignmentId) return;
    document.addEventListener("keydown", handleKeyDown);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [modalAssignmentId, handleKeyDown]);

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
        accept=".pdf,.zip"
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
                    Grade
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

                  return (
                    <tr key={assignment.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
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
                      <td className="px-4 py-3 text-xs">
                        {isPending ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="font-semibold text-emerald-400">
                            {assignment.grade
                              ? assignment.totalScore != null
                                ? `${assignment.grade} (${assignment.totalScore})`
                                : assignment.grade
                              : assignment.totalScore != null
                                ? assignment.totalScore
                                : "Submitted"}
                          </span>
                        )}
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
                            onClick={() => handleOpenModal(assignment.id)}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            <IconUpload size={13} className="inline mr-1" />
                            Submit
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-400">
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
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

      {/*
        Modal is portaled to document.body instead of rendering inline.
        This is the fix: if a parent (like the sp-view-enter wrapper above,
        or any ancestor with a transform/animation/filter) creates a new
        containing block, `position: fixed` inside it stops covering the
        real viewport — it gets sized/positioned relative to that ancestor
        instead, which is what was causing the overlay to look wrong.
        Portaling to document.body guarantees `fixed inset-0` always means
        "the whole screen," no matter what wraps this component.
      */}
      {mounted &&
        modalAssignmentId &&
        modalAssignment &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
            aria-label="Submit Assignment"
          >
            <div
              ref={modalRef}
              className="w-lg max-w-xl rounded-2xl border border-border/90 bg-card shadow-2xl shadow-black/20 animate-in fade-in zoom-in-50 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Submit Assignment
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {modalAssignment.assignmentName}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card-hover hover:text-foreground transition-colors"
                  aria-label="Close dialog"
                >
                  <IconX size={18} stroke={1.5} />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                {selectedFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconFile size={20} />
                    </div>
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-card-hover hover:text-danger transition-colors"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-7 text-center transition-all hover:border-primary/50 hover:bg-primary/[0.06] group"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <IconUpload size={24} />
                    </div>
                  <p className="text-sm font-semibold text-foreground">
                    Click to upload file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF or ZIP &middot; Max 25 MB
                  </p>
                  </button>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Comment{" "}
                    <span className="font-normal normal-case text-muted">
                      (optional)
                    </span>
                  </label>
                  <div className="mt-1.5">
                    <RichEditor
                      content={comment}
                      onChange={setComment}
                      placeholder="Add any notes or comments about your submission..."
                      minHeight="250px"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
                <button
                  onClick={handleCloseModal}
                  className="btn-secondary text-sm font-semibold px-5 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitFile(modalAssignment.id)}
                  disabled={!selectedFile || uploading === modalAssignment.id}
                  className="btn-primary text-sm font-semibold px-6 py-2 disabled:opacity-50"
                >
                  {uploading === modalAssignment.id ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}