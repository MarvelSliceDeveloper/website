"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { IconHistory, IconRefresh } from "@tabler/icons-react";

type LoginEntry = {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  loginAt: string;
  logoutAt: string | null;
  user: { id: string; name: string; email: string };
};

export default function LoginHistoryPage() {
  usePageTitle("Login History");
  const [logs, setLogs] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await api.get<{
        logs: LoginEntry[];
        pagination: { total: number };
      }>("/api/admin/login-history", { page: String(page), limit: "50" });
      setLogs(data.logs);
      setTotal(data.pagination.total);
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Users
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
          <IconHistory size={28} className="text-primary-hover" />
          Login History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All user login activity across the platform.
        </p>
      </div>

      <button
        onClick={fetchLogs}
        className="btn-secondary text-xs py-2 flex items-center gap-1.5 w-fit"
      >
        <IconRefresh size={14} /> Refresh
      </button>

      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No login history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">User</th>
                  <th className="py-2.5 pr-3">IP</th>
                  <th className="py-2.5 pr-3">User Agent</th>
                  <th className="py-2.5 pr-3">Login At</th>
                  <th className="py-2.5">Logout At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {log.user.name}
                      </span>
                      <span className="ml-1.5 text-[10px] text-muted">
                        {log.user.email}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-[10px] text-muted">
                      {log.ip || "—"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate text-[10px]">
                      {log.userAgent || "—"}
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(log.loginAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-muted whitespace-nowrap">
                      {log.logoutAt
                        ? new Date(log.logoutAt).toLocaleString("en-IN")
                        : "—"}
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
