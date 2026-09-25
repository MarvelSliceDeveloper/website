"use client";

import {
  IconArrowRight,
  IconEye,
  IconEdit,
  IconTrash,
  IconFileSpreadsheet,
  IconExternalLink,
} from "@tabler/icons-react";
import type { Assignment } from "../types";

interface AssignmentRowProps {
  assignment: Assignment;
  onReview: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

type RailTone = "rose" | "amber" | "emerald" | "slate";

const railStyles: Record<RailTone, string> = {
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  slate: "bg-slate-300 dark:bg-slate-600",
};

export function AssignmentRow({
  assignment,
  onReview,
  onViewDetails,
  onEdit,
  onDelete,
}: AssignmentRowProps) {
  // Submissions stats (same math as before, new skin)
  const totalSubmissions =
    assignment._count?.submissions ?? assignment.submissions?.length ?? 0;
  const pendingCount =
    assignment.submissions?.filter((s) => s.status === "PENDING").length ?? 0;
  const gradedCount =
    assignment.submissions?.filter((s) => s.status === "GRADED").length ?? 0;

  const totalEnrolled =
    assignment.batch?._count?.enrollments ??
    (totalSubmissions > 0 ? totalSubmissions : 0);

  const submissionPercentage =
    totalEnrolled > 0
      ? Math.min(100, Math.round((totalSubmissions / totalEnrolled) * 100))
      : totalSubmissions > 0
        ? 100
        : 0;

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffMs < 0;

  let railTone: RailTone = "slate";
  let duePill = "";
  let duePillClasses = "bg-muted text-muted-foreground";

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    railTone = "rose";
    duePill =
      overdueDays === 0 ? "OVERDUE TODAY" : `OVERDUE · ${overdueDays}d ago`;
    duePillClasses =
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20";
  } else if (diffDays === 0) {
    railTone = "amber";
    duePill = "DUE TODAY";
    duePillClasses =
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20";
  } else if (diffDays <= 7) {
    railTone = pendingCount > 0 ? "amber" : "slate";
    duePill = diffDays === 1 ? "DUE TOMORROW" : `DUE IN ${diffDays} DAYS`;
    duePillClasses =
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20";
  } else {
    railTone = pendingCount > 0 ? "amber" : "slate";
    duePill = `DUE IN ${diffDays} DAYS`;
  }

  if (pendingCount === 0 && gradedCount > 0 && !isOverdue) {
    railTone = "emerald";
  }

  const formattedDueDate = dueDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs transition-all hover:border-primary/40 hover:shadow-md">
      {/* Left status rail */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${railStyles[railTone]}`}
      />
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        {/* Top: icon + title + pills + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <IconFileSpreadsheet size={20} stroke={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(assignment)}
                  className="truncate text-left text-base font-bold text-foreground transition-colors hover:text-primary cursor-pointer"
                >
                  {assignment.title}
                </button>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Assignment
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${duePillClasses}`}
                >
                  {duePill}
                </span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    {pendingCount} to review
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">
                  {assignment.course.title}
                </span>
                {" · "}
                {assignment.batch ? assignment.batch.name : "All Batches"}
                {" · Due "}
                <span className="font-semibold text-foreground">
                  {formattedDueDate}
                </span>
              </p>
            </div>
          </div>

          {/* Always-visible actions (no hidden menu) */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onReview(assignment)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 cursor-pointer"
            >
              {pendingCount > 0 ? `Review (${pendingCount})` : "Review"}
              <IconArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onViewDetails(assignment)}
              title="View details"
              aria-label="View details"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-500/10 cursor-pointer"
            >
              <IconEye size={16} />
            </button>
            <button
              type="button"
              onClick={() => onEdit(assignment)}
              title="Edit assignment"
              aria-label="Edit assignment"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/10 cursor-pointer"
            >
              <IconEdit size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(assignment)}
              title="Delete assignment"
              aria-label="Delete assignment"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-danger transition-all hover:bg-danger/10 cursor-pointer"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>

        {/* Bottom: progress + evaluation */}
        <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-border/50 pt-3.5 sm:grid-cols-2 sm:items-center">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Submissions
              </span>
              <span className="font-bold text-foreground">
                {totalEnrolled > 0 ? (
                  <>
                    {totalSubmissions} / {totalEnrolled}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({submissionPercentage}%)
                    </span>
                  </>
                ) : (
                  <>{totalSubmissions} submitted</>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-border/40 bg-muted/40">
              <div
                className={`h-full rounded-full transition-all ${
                  pendingCount === 0 && gradedCount > 0
                    ? "bg-emerald-500"
                    : submissionPercentage >= 40
                      ? "bg-primary"
                      : totalSubmissions > 0
                        ? "bg-blue-400"
                        : "bg-muted"
                }`}
                style={{ width: `${Math.max(4, submissionPercentage)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <p className="text-xs font-bold">
              {pendingCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {pendingCount} pending review
                </span>
              ) : gradedCount > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  All {gradedCount} graded
                </span>
              ) : (
                <span className="font-medium text-muted-foreground">
                  No submissions yet
                </span>
              )}
            </p>
            {assignment.questionPdfUrl && (
              <a
                href={assignment.questionPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <IconExternalLink size={13} />
                Question PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
