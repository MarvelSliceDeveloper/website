"use client";

import { useMemo } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import {
  IconServer,
  IconDatabase,
  IconCloud,
  IconKey,
  IconMail,
  IconVideo,
  IconRefresh,
} from "@tabler/icons-react";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  version?: string;
  nodeVersion?: string;
}

interface ServiceStatus {
  name: string;
  status: "ok" | "error" | "loading";
  detail: string;
  icon: React.ReactNode;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminHealthPage() {
  usePageTitle("Health");

  const healthQuery = useApiQuery<HealthData>(
    ["admin", "health", "core"],
    "/api/admin/users/health",
  );
  const youtubeQuery = useApiQuery(
    ["admin", "health", "youtube"],
    "/api/youtube/video-info",
    { url: "dQw4w9WgXcQ" },
  );
  const azureQuery = useApiQuery<{
    configured?: boolean;
    envConfigured?: boolean;
    linked?: boolean;
  }>(["admin", "health", "azure-ad"], "/api/auth/azure-ad/status");
  const paymentsQuery = useApiQuery(
    ["admin", "health", "payments"],
    "/api/payments/batches",
  );

  const health = healthQuery.data ?? null;
  const loading =
    healthQuery.isPending ||
    youtubeQuery.isPending ||
    azureQuery.isPending ||
    paymentsQuery.isPending;

  const services = useMemo<ServiceStatus[]>(() => {
    const apiServer: ServiceStatus = healthQuery.isPending
      ? {
          name: "API Server",
          status: "loading",
          detail: "Checking...",
          icon: <IconServer size={18} />,
        }
      : healthQuery.isError
        ? {
            name: "API Server",
            status: "error",
            detail: "Unreachable",
            icon: <IconServer size={18} />,
          }
        : {
            name: "API Server",
            status: health?.status === "ok" ? "ok" : "error",
            detail: `Uptime: ${formatUptime(health?.uptime ?? 0)}`,
            icon: <IconServer size={18} />,
          };

    const db: ServiceStatus = healthQuery.isPending
      ? {
          name: "Database (PostgreSQL)",
          status: "loading",
          detail: "Checking...",
          icon: <IconDatabase size={18} />,
        }
      : healthQuery.isError
        ? {
            name: "Database (PostgreSQL)",
            status: "error",
            detail: "Unknown",
            icon: <IconDatabase size={18} />,
          }
        : {
            name: "Database (PostgreSQL)",
            status: health?.database === "connected" ? "ok" : "error",
            detail:
              health?.database === "connected" ? "Connected" : "Disconnected",
            icon: <IconDatabase size={18} />,
          };

    const youtube: ServiceStatus = youtubeQuery.isPending
      ? {
          name: "YouTube API",
          status: "loading",
          detail: "Checking...",
          icon: <IconVideo size={18} />,
        }
      : {
          name: "YouTube API",
          status: youtubeQuery.isSuccess ? "ok" : "error",
          detail: youtubeQuery.isSuccess ? "Configured" : "Not configured",
          icon: <IconVideo size={18} />,
        };

    const msData = azureQuery.data;
    const msOk = msData?.envConfigured || msData?.linked || msData?.configured;
    const azure: ServiceStatus = azureQuery.isPending
      ? {
          name: "Microsoft Azure AD",
          status: "loading",
          detail: "Checking...",
          icon: <IconCloud size={18} />,
        }
      : {
          name: "Microsoft Azure AD",
          status: msOk ? "ok" : "error",
          detail: msOk ? "Configured" : "Not configured",
          icon: <IconCloud size={18} />,
        };

    const payments: ServiceStatus = {
      name: "Payments (Razorpay)",
      status: "ok",
      detail: paymentsQuery.isSuccess ? "Connected" : "Available",
      icon: <IconKey size={18} />,
    };

    const email: ServiceStatus = {
      name: "Email Service (Brevo)",
      status: apiServer.status === "ok" ? "ok" : "error",
      detail: apiServer.status === "ok" ? "Available" : "Unreachable",
      icon: <IconMail size={18} />,
    };

    return [apiServer, db, youtube, azure, payments, email];
  }, [
    health,
    healthQuery.isPending,
    healthQuery.isError,
    youtubeQuery.isPending,
    youtubeQuery.isSuccess,
    azureQuery.isPending,
    azureQuery.data,
    paymentsQuery.isSuccess,
  ]);

  const handleRefresh = () => {
    void healthQuery.refetch();
    void youtubeQuery.refetch();
    void azureQuery.refetch();
    void paymentsQuery.refetch();
  };

  const okCount = services.filter((s) => s.status === "ok").length;
  const errorCount = services.filter((s) => s.status === "error").length;
  const overallStatus =
    errorCount === 0
      ? "Healthy"
      : okCount > errorCount
        ? "Degraded"
        : "Unhealthy";
  const overallColor =
    errorCount === 0
      ? "text-success"
      : okCount > errorCount
        ? "text-warning"
        : "text-danger";
  const overallDotColor =
    errorCount === 0
      ? "bg-success"
      : okCount > errorCount
        ? "bg-warning"
        : "bg-danger";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconServer size={28} className="text-primary-hover" />
            System Health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time status of all platform services and dependencies.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${overallDotColor}`} />
          <h2 className={`text-lg font-bold ${overallColor}`}>
            {overallStatus}
          </h2>
          <span className="text-sm text-muted-foreground">
            ({okCount}/{services.length || 6} services healthy)
          </span>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-card border border-border animate-pulse"
              />
            ))
          : services.map((svc) => (
              <div
                key={svc.name}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      svc.status === "ok"
                        ? "bg-success"
                        : svc.status === "error"
                          ? "bg-danger"
                          : "bg-muted animate-pulse"
                    }`}
                  />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {svc.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted">{svc.icon}</span>
                  <span
                    className={`text-sm font-semibold ${
                      svc.status === "ok"
                        ? "text-success"
                        : svc.status === "error"
                          ? "text-danger"
                          : "text-muted"
                    }`}
                  >
                    {svc.detail}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* Server Details */}
      {health && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Server Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-sm font-medium text-foreground">
                {formatUptime(health.uptime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Memory Usage</p>
              <p className="text-sm font-medium text-foreground">
                {formatBytes(health.memory.heapUsed)} /{" "}
                {formatBytes(health.memory.heapTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RSS Memory</p>
              <p className="text-sm font-medium text-foreground">
                {formatBytes(health.memory.rss)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Checked</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
