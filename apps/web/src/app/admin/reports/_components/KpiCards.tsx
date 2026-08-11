"use client";

import { formatINR, pctChange } from "@/lib/report-utils";

export interface KpiItem {
  label: string;
  value: number;
  prev?: number | null;
  suffix?: string;
  isCurrency?: boolean;
}

export default function KpiCards({ kpis }: { kpis: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {kpis.map((m) => {
        const delta =
          m.prev !== null && m.prev !== undefined
            ? pctChange(m.value, m.prev)
            : null;
        return (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40"
          >
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {m.isCurrency
                ? formatINR(m.value)
                : `${m.value.toLocaleString("en-IN")}${m.suffix ?? ""}`}
            </p>
            {delta && (
              <p
                className={`mt-1 text-xs font-medium ${
                  delta.direction === "up"
                    ? "text-success"
                    : delta.direction === "down"
                      ? "text-danger"
                      : "text-muted-foreground"
                }`}
              >
                {delta.direction === "up"
                  ? "▲"
                  : delta.direction === "down"
                    ? "▼"
                    : "—"}{" "}
                {delta.text} vs last period
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
