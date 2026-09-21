"use client";

import {
  IconClipboardList,
  IconClock,
  IconCheck,
  IconCalendarEvent,
} from "@tabler/icons-react";

interface StatsStripProps {
  totalAssignments: number;
  pendingReviewCount: number;
  reviewedCount: number;
  dueSoonCount: number;
  loading?: boolean;
}

function StatCell({
  icon,
  value,
  label,
  sub,
  loading,
  highlight,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sub: string;
  loading: boolean;
  highlight?: "amber" | "emerald" | "blue" | "primary";
}) {
  const valueColor =
    highlight === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : highlight === "emerald"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-2xl font-extrabold leading-none ${valueColor}`}>
          {loading ? "—" : value}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
          {sub}
        </p>
      </div>
    </div>
  );
}

export function StatsStrip({
  totalAssignments,
  pendingReviewCount,
  reviewedCount,
  dueSoonCount,
  loading = false,
}: StatsStripProps) {
  return (
    <section
      aria-label="Assignment statistics"
      className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-card shadow-2xs sm:flex-row sm:divide-x sm:divide-y-0"
    >
      <StatCell
        icon={<IconClipboardList size={20} stroke={1.8} />}
        value={totalAssignments}
        label="Total Assignments"
        sub="Active & published"
        loading={loading}
        highlight="primary"
      />
      <StatCell
        icon={<IconClock size={20} stroke={1.8} />}
        value={pendingReviewCount}
        label="Pending Review"
        sub={pendingReviewCount > 0 ? "Waiting for grading" : "All caught up"}
        loading={loading}
        highlight={pendingReviewCount > 0 ? "amber" : undefined}
      />
      <StatCell
        icon={<IconCheck size={20} stroke={1.8} />}
        value={reviewedCount}
        label="Reviewed"
        sub="Submissions graded"
        loading={loading}
        highlight="emerald"
      />
      <StatCell
        icon={<IconCalendarEvent size={20} stroke={1.8} />}
        value={dueSoonCount}
        label="Due This Week"
        sub="Upcoming deadlines"
        loading={loading}
        highlight="blue"
      />
    </section>
  );
}
