"use client";

import { Card, CardContent } from "@/components/ui/Card";
import {
  IconClipboardList,
  IconClock,
  IconCheck,
  IconCalendarEvent,
} from "@tabler/icons-react";

interface AssignmentStatsProps {
  totalAssignments: number;
  pendingReviewCount: number;
  reviewedCount: number;
  dueSoonCount: number;
  loading?: boolean;
}

export function AssignmentStats({
  totalAssignments,
  pendingReviewCount,
  reviewedCount,
  dueSoonCount,
  loading = false,
}: AssignmentStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Assignments */}
      <Card className="border border-border/80 shadow-2xs transition-all hover:border-primary/30">
        <CardContent className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <IconClipboardList size={22} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-none text-foreground">
              {loading ? "—" : totalAssignments}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Assignments
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Active & published
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pending Review / Needs Action */}
      <Card
        className={`border shadow-2xs transition-all ${
          pendingReviewCount > 0
            ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
            : "border-border/80 hover:border-border"
        }`}
      >
        <CardContent className="p-5 flex items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              pendingReviewCount > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 ring-2 ring-amber-500/20"
                : "bg-muted/30 text-muted-foreground border-border"
            }`}
          >
            <IconClock size={22} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-2xl font-extrabold leading-none ${
                  pendingReviewCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {loading ? "—" : pendingReviewCount}
              </p>
              {pendingReviewCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Action
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending Review
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              {pendingReviewCount > 0 ? "Waiting for grading" : "All caught up"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Reviewed / Graded */}
      <Card className="border border-border/80 shadow-2xs transition-all hover:border-emerald-500/30">
        <CardContent className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <IconCheck size={22} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-none text-emerald-600 dark:text-emerald-400">
              {loading ? "—" : reviewedCount}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Reviewed
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Submissions graded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Due Soon / This Week */}
      <Card className="border border-border/80 shadow-2xs transition-all hover:border-blue-500/30">
        <CardContent className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <IconCalendarEvent size={22} stroke={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-none text-foreground">
              {loading ? "—" : dueSoonCount}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Due This Week
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Upcoming deadlines
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
