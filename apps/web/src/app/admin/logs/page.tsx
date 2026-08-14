"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconFileDescription,
  IconRefresh,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

type LogEntry = {
  id: string;
  userId: string;
  action: string;
  endpoint: string;
  statusCode: number | null;
  success: boolean;
  errorMsg: string | null;
  durationMs: number | null;
  createdAt: string;
};

export default function ActivityLogsPage() {
  usePageTitle("Logs");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const logsQuery = useApiQuery<{
    logs: LogEntry[];
    pagination: { total: number };
  }>(
    ["admin", "logs", actionFilter || "all", page],
    "/api/admin/logs",
    {
      page: String(page),
      limit: "50",
      ...(actionFilter ? { action: actionFilter } : {}),
    },
    { refetchInterval: 10000 },
  );
  const logs = logsQuery.data?.logs ?? [];
  const total = logsQuery.data?.pagination.total ?? 0;
  const loading = logsQuery.isPending;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
          <IconFileDescription size={28} className="text-primary-hover" />
          Activity Logs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Graph API call history across the platform. Auto-refreshes every 10s.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="input text-xs w-48"
        >
          <option value="">All Actions</option>
          <option value="createOnlineMeeting">createOnlineMeeting</option>
          <option value="getCalendarView">getCalendarView</option>
          <option value="syncRecording">syncRecording</option>
        </select>
        <button
          onClick={() => void logsQuery.refetch()}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
        <span className="text-xs text-muted-foreground">
          {total} total entries
        </span>
      </div>

      {/* Table */}
      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Time</th>
                  <th className="py-2.5 pr-3">Action</th>
                  <th className="py-2.5 pr-3">Endpoint</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Duration</th>
                  <th className="py-2.5">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-card-hover transition-colors ${!log.success ? "bg-danger/5" : ""}`}
                  >
                    <td className="py-2.5 pr-3 text-muted whitespace-nowrap font-mono text-[10px]">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[10px] text-muted-foreground max-w-[200px] truncate">
                      {log.endpoint}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.success
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {log.success ? (
                          <>
                            <IconCheck size={10} /> {log.statusCode}
                          </>
                        ) : (
                          <>
                            <IconX size={10} /> {log.statusCode || "—"}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted font-mono text-[10px]">
                      {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                    </td>
                    <td className="py-2.5 text-muted-foreground max-w-[180px] truncate">
                      {log.errorMsg || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 50 >= total}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
