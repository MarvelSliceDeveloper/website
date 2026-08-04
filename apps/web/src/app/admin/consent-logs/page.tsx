"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconRefresh } from "@tabler/icons-react";

type ConsentEntry = {
  id: string;
  userId: string;
  type: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export default function ConsentLogsPage() {
  usePageTitle("Consent Logs");
  const [logs, setLogs] = useState<ConsentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await api.get<{ logs: ConsentEntry[] }>(
        "/api/admin/consent-logs",
        { page: String(page), limit: "50" },
      );
      setLogs(data.logs);
      setTotal(data.logs.length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Consent Logs"
        description="History of user consent actions (Microsoft, Data Processing)."
        breadcrumbs={[{ label: "Consent Logs", href: "/admin/consent-logs" }]}
      />

      <button
        onClick={fetchLogs}
        className="btn-secondary text-xs py-2 flex items-center gap-1.5 w-fit"
      >
        <IconRefresh size={14} /> Refresh
      </button>

      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-foreground/60 animate-pulse">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-foreground/50">
            No consent logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">User ID</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Action</th>
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono text-[10px] text-foreground/70">
                      {log.userId.slice(0, 12)}...
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {log.action}
                    </td>
                    <td className="py-3 pr-3 text-foreground/60 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-foreground/60 max-w-[200px] truncate text-[10px]">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
