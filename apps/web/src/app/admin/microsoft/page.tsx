"use client";

import { useState } from "react";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconBrandWindows,
  IconCheck,
  IconX,
  IconRefresh,
  IconLink,
  IconClock,
  IconCode,
} from "@tabler/icons-react";

type LogEntry = {
  id: string;
  action: string;
  endpoint: string;
  statusCode: number | null;
  success: boolean;
  errorMsg: string | null;
  durationMs: number | null;
  createdAt: string;
};

type StatusData = {
  linked: boolean;
  msUserId: string | null;
  envConfigured: boolean;
  env: {
    MS_CLIENT_ID: boolean;
    MS_CLIENT_SECRET: boolean;
    MS_REDIRECT_URI: boolean;
  };
  logs: LogEntry[];
};

export default function MicrosoftIntegrationPage() {
  usePageTitle("Microsoft Integration");
  const [linking, setLinking] = useState(false);

  const statusQuery = useApiQuery<StatusData>(
    ["admin", "microsoft", "status"],
    "/api/auth/azure-ad/status",
  );
  const status = statusQuery.data ?? null;
  const loading = statusQuery.isPending;

  function handleLinkAccount() {
    setLinking(true);
    window.location.href = "/api/auth/azure-ad/login";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
          <IconBrandWindows size={28} className="text-primary-hover" />
          Microsoft Integration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your Microsoft Teams, Calendar, and Graph API connection.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading status...</p>
        </div>
      ) : !status ? (
        <div className="glass-card p-12 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-2 font-semibold text-foreground">
            Failed to load status
          </p>
          <button onClick={() => void statusQuery.refetch()} className="btn-primary mt-4 text-xs">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Account Status */}
            <div
              className={`glass-card p-5 border ${status.linked ? "border-emerald-500/30" : "border-amber-500/30"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Status
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {status.linked ? "Connected" : "Not Linked"}
                  </p>
                  {status.linked && (
                    <p className="mt-1 text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                      MS ID: {status.msUserId?.slice(0, 20)}...
                    </p>
                  )}
                </div>
                <div
                  className={`p-2 rounded-full ${status.linked ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                >
                  {status.linked ? (
                    <IconCheck size={20} />
                  ) : (
                    <IconX size={20} />
                  )}
                </div>
              </div>
              <div className="mt-4">
                {status.linked ? (
                  <button
                    onClick={() =>
                      (window.location.href = "/api/auth/azure-ad/login")
                    }
                    className="btn-secondary w-full justify-center text-xs py-2 flex items-center gap-1.5"
                  >
                    <IconRefresh size={14} /> Re-link Account
                  </button>
                ) : (
                  <button
                    onClick={handleLinkAccount}
                    disabled={linking}
                    className="btn-primary w-full justify-center text-xs py-2 flex items-center gap-1.5"
                  >
                    {linking ? (
                      <>
                        <IconRefresh size={14} className="animate-spin" />{" "}
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <IconLink size={14} /> Link Microsoft Account
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Env Configuration */}
            <div
              className={`glass-card p-5 border ${status.envConfigured ? "border-emerald-500/30" : "border-danger/30"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Configuration
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {status.envConfigured ? "Configured" : "Missing Vars"}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-full ${status.envConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-danger/10 text-danger"}`}
                >
                  {status.envConfigured ? (
                    <IconCheck size={20} />
                  ) : (
                    <IconX size={20} />
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {(
                  [
                    "MS_CLIENT_ID",
                    "MS_CLIENT_SECRET",
                    "MS_REDIRECT_URI",
                  ] as const
                ).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-muted-foreground">
                      {key}
                    </span>
                    <span
                      className={`font-medium ${status.env[key] ? "text-emerald-400" : "text-danger"}`}
                    >
                      {status.env[key] ? "Set" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-5 border border-border/80">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    Tools
                  </p>
                </div>
                <div className="p-2 rounded-full bg-violet-500/10 text-violet-400">
                  <IconCode size={20} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => void statusQuery.refetch()}
                  className="btn-secondary w-full justify-center text-xs py-2 flex items-center gap-1.5"
                >
                  <IconRefresh size={14} /> Refresh Status
                </button>
                <a
                  href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center text-xs py-2 flex items-center gap-1.5"
                >
                  <IconLink size={14} /> Azure Portal
                </a>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-card p-5 border border-border/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <IconClock size={15} /> Recent Graph API Activity
              </h2>
              <button
                onClick={() => void statusQuery.refetch()}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
              >
                <IconRefresh size={13} /> Refresh
              </button>
            </div>

            {status.logs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No Graph API calls recorded yet. Activity will appear here once
                Microsoft integration is used.
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
                    {status.logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-card-hover transition-colors"
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
        </>
      )}
    </div>
  );
}
