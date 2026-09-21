"use client";

import { IconBell, IconArrowRight } from "@tabler/icons-react";
import type { Assignment } from "../types";

interface AttentionStripProps {
  assignmentsWithPending: Array<{
    assignment: Assignment;
    pendingCount: number;
  }>;
  totalPendingCount: number;
  onReview: (assignment: Assignment) => void;
}

export function AttentionStrip({
  assignmentsWithPending,
  totalPendingCount,
  onReview,
}: AttentionStripProps) {
  if (totalPendingCount === 0 || assignmentsWithPending.length === 0) {
    return null;
  }

  const visible = assignmentsWithPending.slice(0, 4);
  const remaining = assignmentsWithPending.length - visible.length;

  return (
    <section
      aria-label="Assignments needing attention"
      className="overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent"
    >
      <div className="flex items-center gap-3 px-5 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <IconBell size={18} />
        </span>
        <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Needs Your Attention
        </p>
        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
          {totalPendingCount}{" "}
          {totalPendingCount === 1 ? "submission" : "submissions"} waiting
        </span>
      </div>
      <ul className="mx-5 mb-2 mt-3 divide-y divide-amber-500/15 rounded-xl border border-amber-500/20 bg-card/80">
        {visible.map(({ assignment, pendingCount }) => (
          <li
            key={assignment.id}
            className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-amber-500/5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {assignment.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {assignment.course.title}
                {assignment.batch ? ` · ${assignment.batch.name}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="whitespace-nowrap rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                {pendingCount}{" "}
                {pendingCount === 1 ? "submission" : "submissions"}
              </span>
              <button
                type="button"
                onClick={() => onReview(assignment)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 cursor-pointer"
              >
                Review
                <IconArrowRight size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="px-5 pb-4 text-xs font-medium text-amber-700 dark:text-amber-400">
          +{remaining} more assignment{remaining === 1 ? "" : "s"} with pending
          submissions
        </p>
      )}
    </section>
  );
}
