"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconRefresh,
  IconSearch,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

type AuditLog = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

const ACTION_OPTIONS = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "BULK_IMPORT",
] as const;

export default function AdminAuditLogsPage() {
  usePageTitle("Audit Logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [filterEmail, setFilterEmail] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isFiltered =
    filterEmail.trim() ||
    filterAction !== "ALL" ||
    filterEntityType.trim() ||
    filterDateStart ||
    filterDateEnd;

  async function fetchLogs() {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (filterEmail.trim()) params.email = filterEmail.trim();
      if (filterAction !== "ALL") params.action = filterAction;
      if (filterEntityType.trim()) params.entityType = filterEntityType.trim();
      if (filterDateStart) params.startDate = filterDateStart;
      if (filterDateEnd) params.endDate = filterDateEnd;

      const data = await api.get<{
        logs: AuditLog[];
        total: number;
      }>("/api/admin/audit-logs", params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page]);

  function handleSearch() {
    setPage(1);
    fetchLogs();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Audit Logs"
        description="Track all user and system actions across the platform."
        breadcrumbs={[{ label: "Audit Logs", href: "/admin/audit-logs" }]}
        role="Administration"
        action={
          <button
            onClick={fetchLogs}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search by email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="input text-xs"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input text-xs"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a === "ALL" ? "All Actions" : a}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Entity Type (e.g. User, Course)"
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="input text-xs"
          />
          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => setFilterDateStart(e.target.value)}
            className="input text-xs"
            title="Start date"
          />
          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => setFilterDateEnd(e.target.value)}
            className="input text-xs"
            title="End date"
          />
        </div>
        <div className="mt-3">
          <button
            onClick={handleSearch}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
          >
            <IconSearch size={14} /> Search
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Timestamp</th>
                  <th className="py-2.5 pr-3">User</th>
                  <th className="py-2.5 pr-3">Action</th>
                  <th className="py-2.5 pr-3">Entity Type</th>
                  <th className="py-2.5 pr-3">Entity ID</th>
                  <th className="py-2.5 pr-3">Details</th>
                  <th className="py-2.5">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-medium text-foreground">
                        {log.userName || "—"}
                      </span>
                      {log.userEmail && <br />}
                      {log.userEmail && (
                        <span className="text-[10px] text-muted-foreground">
                          {log.userEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {log.entityType}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[10px] text-muted-foreground">
                      {log.entityId ? `${log.entityId.slice(0, 8)}...` : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {log.details ? (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          className="flex items-center gap-1 text-primary hover:text-primary-hover transition-colors"
                        >
                          {expandedId === log.id ? (
                            <IconChevronUp size={12} />
                          ) : (
                            <IconChevronDown size={12} />
                          )}
                          <span className="text-[10px]">View</span>
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-[10px] text-muted-foreground">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Expanded details rows */}
            {logs.map(
              (log) =>
                expandedId === log.id &&
                log.details && (
                  <div
                    key={`detail-${log.id}`}
                    className="border-t border-border/40 bg-muted/20 px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                      Details:
                    </p>
                    <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ),
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
