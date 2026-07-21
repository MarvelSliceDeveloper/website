"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconChartBar, IconRefresh } from "@tabler/icons-react";

type StatsData = {
  stats: {
    totalLogs: number;
    failedLogs: number;
    errorRate: string;
    topErrors: { error: string; count: number }[];
  };
};

export default function LogStatsPage() {
  const [stats, setStats] = useState<StatsData["stats"] | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const data = await api.get<StatsData>("/api/admin/logs/stats");
      setStats(data.stats);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconChartBar size={28} className="text-primary-hover" />
            Activity Stats
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Graph API error analytics for the last 30 days.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading stats...</p>
        </div>
      ) : !stats ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Failed to load stats.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card p-5 border border-border/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Requests
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stats.totalLogs}
            </p>
          </div>
          <div className="glass-card p-5 border border-border/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Failed Requests
            </p>
            <p className="mt-2 text-3xl font-bold text-danger">
              {stats.failedLogs}
            </p>
          </div>
          <div className="glass-card p-5 border border-border/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Error Rate
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {stats.errorRate}%
            </p>
          </div>

          {stats.topErrors.length > 0 && (
            <div className="md:col-span-3 glass-card p-5 border border-border/80">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Top Errors
              </p>
              <div className="space-y-2">
                {stats.topErrors.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span className="text-muted-foreground font-mono truncate max-w-[500px]">
                      {e.error}
                    </span>
                    <span className="font-bold text-danger ml-4 shrink-0">
                      {e.count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
