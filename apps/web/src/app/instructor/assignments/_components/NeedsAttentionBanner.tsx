"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  IconBell,
  IconArrowRight,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import type { Assignment } from "../types";

interface NeedsAttentionBannerProps {
  assignmentsWithPending: Array<{
    assignment: Assignment;
    pendingCount: number;
  }>;
  totalPendingCount: number;
  onReview: (assignment: Assignment) => void;
}

export function NeedsAttentionBanner({
  assignmentsWithPending,
  totalPendingCount,
  onReview,
}: NeedsAttentionBannerProps) {
  if (totalPendingCount === 0 || assignmentsWithPending.length === 0) {
    return null;
  }

  const visible = assignmentsWithPending.slice(0, 4);
  const remaining = assignmentsWithPending.length - visible.length;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-xs overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <IconBell size={20} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Needs Your Attention
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                {totalPendingCount}{" "}
                {totalPendingCount === 1 ? "submission" : "submissions"} waiting
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/90 font-medium">
              Students have submitted assignments that are pending your
              evaluation and feedback.
            </p>

            {/* List of pending items */}
            <div className="mt-3.5 divide-y divide-amber-500/15 rounded-xl border border-amber-500/20 bg-card/80 backdrop-blur-xs">
              {visible.map(({ assignment, pendingCount }) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 transition-colors hover:bg-amber-500/5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                      <IconFileSpreadsheet size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {assignment.course.title}
                        {assignment.batch ? ` · ${assignment.batch.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {pendingCount}{" "}
                      {pendingCount === 1 ? "submission" : "submissions"}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onReview(assignment)}
                      rightIcon={<IconArrowRight size={14} />}
                      className="text-xs shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {remaining > 0 && (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                +{remaining} more assignment{remaining === 1 ? "" : "s"} with
                pending submissions
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
