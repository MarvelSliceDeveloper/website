"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  IconBrandWindows,
  IconLink,
  IconUnlink,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconExternalLink,
} from "@tabler/icons-react";

type AzureStatus = {
  linked: boolean;
  msUserId: string | null;
  envConfigured: boolean;
  env: {
    MS_CLIENT_ID: boolean;
    MS_CLIENT_SECRET: boolean;
    MS_REDIRECT_URI: boolean;
  };
  logs: Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    createdAt: string;
  }>;
};

export default function MicrosoftPage() {
  const [status, setStatus] = useState<AzureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  async function fetchStatus() {
    setLoading(true);
    try {
      const me = await api.get<{ user: { role: string } }>("/api/auth/me");
      setUserRole(me?.user?.role ?? null);

      const data = await api.get<AzureStatus>("/api/auth/azure/status");
      setStatus(data);
    } catch {
      toast.error("Failed to load Microsoft integration status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  function handleLink() {
    window.location.href = "/api/auth/azure/login";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconBrandWindows size={28} className="text-primary-hover" />
            Microsoft Integration
          </h1>
        </div>
        <div className="glass-card p-5 border border-border/80">
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconBrandWindows size={28} className="text-primary-hover" />
            Microsoft Integration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Microsoft Teams meeting, calendar, and recording integration via
            Microsoft Graph API.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className="glass-card p-5 border border-border/80 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Connection Status</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Account Linked</p>
            <div className="flex items-center gap-2">
              {status?.linked ? (
                <IconCheck size={16} className="text-green-500" />
              ) : (
                <IconX size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {status?.linked ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Server Config</p>
            <div className="flex items-center gap-2">
              {status?.envConfigured ? (
                <IconCheck size={16} className="text-green-500" />
              ) : (
                <IconAlertCircle size={16} className="text-yellow-500" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {status?.envConfigured ? "Configured" : "Incomplete"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Microsoft User ID</p>
            <span className="text-sm font-semibold text-foreground font-mono">
              {status?.msUserId || "—"}
            </span>
          </div>
        </div>

        {status?.env && (
          <div className="rounded-lg border border-border/60 p-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Environment Variables
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(status.env).map(([key, ok]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded ${
                    ok
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {ok ? <IconCheck size={10} /> : <IconX size={10} />}
                  {key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link / Unlink Actions (Super Admin only) */}
        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            {status?.linked ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 px-3 py-2 rounded-lg">
                <IconCheck size={14} /> Microsoft account is linked
              </span>
            ) : (
              <button
                onClick={handleLink}
                className="btn-primary text-xs py-2 flex items-center gap-1.5"
              >
                <IconLink size={14} /> Link Microsoft Account
              </button>
            )}
          </div>
        )}

        {!isSuperAdmin && (
          <p className="text-xs text-muted-foreground">
            Only Super Admin can link or manage the Microsoft account.
          </p>
        )}
      </div>

      {/* Recent Graph API Logs */}
      <div className="glass-card p-5 border border-border/80">
        <h2 className="text-sm font-bold text-foreground mb-4">
          Recent API Activity
        </h2>
        {!status?.logs || status.logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent API activity.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Endpoint</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {status.logs.map((log) => (
                  <tr key={log.id} className="text-foreground">
                    <td className="py-2">
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded ${
                          log.method === "GET"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-muted-foreground">
                      {log.endpoint}
                    </td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          log.statusCode >= 200 && log.statusCode < 300
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
