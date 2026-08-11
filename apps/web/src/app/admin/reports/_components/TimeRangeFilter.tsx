"use client";

import { IconCalendar, IconRefresh } from "@tabler/icons-react";
import { TIME_RANGES } from "@/lib/report-utils";

export default function TimeRangeFilter({
  timeRange,
  onChange,
  onRefresh,
}: {
  timeRange: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconCalendar size={16} className="text-muted-foreground" />
      {TIME_RANGES.map((tr) => (
        <button
          key={tr.value}
          onClick={() => onChange(tr.value)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
            timeRange === tr.value
              ? "bg-primary/10 text-primary border-primary/20"
              : "border-border text-muted-foreground hover:bg-card-hover"
          }`}
        >
          {tr.label}
        </button>
      ))}
      <button
        onClick={onRefresh}
        className="ml-2 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover transition-colors cursor-pointer"
        title="Refresh"
      >
        <IconRefresh size={14} />
      </button>
    </div>
  );
}
