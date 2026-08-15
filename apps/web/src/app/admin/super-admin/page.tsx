"use client";

import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import Link from "next/link";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  memory: { rss: number; heapTotal: number; heapUsed: number };
}

interface StatCardProps {
  label: string;
  value: string;
  status?: "ok" | "degraded" | "error";
}

function StatCard({ label, value, status }: StatCardProps) {
  const dotColor =
    status === "ok"
      ? "bg-success"
      : status === "degraded"
        ? "bg-warning"
        : "bg-muted";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        {status && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function SuperAdminPage() {
  usePageTitle("Super Admin");

  const healthQuery = useApiQuery<HealthData>(
    ["admin", "super-admin", "health"],
    "/api/admin/users/health",
  );
  const loading = healthQuery.isLoading;
  const health = healthQuery.data ?? null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const tools = [
    {
      label: "System Health",
      href: "/admin/health",
      desc: "Real-time service status and diagnostics",
    },
    {
      label: "System Settings",
      href: "/admin/settings/system",
      desc: "Global platform configuration",
    },
    {
      label: "API Keys",
      href: "/admin/settings/api-keys",
      desc: "Manage API access keys",
    },
    {
      label: "Permissions",
      href: "/admin/settings/permissions",
      desc: "Role-based access control",
    },
    {
      label: "Microsoft Integration",
      href: "/admin/microsoft",
      desc: "Teams & Graph API setup",
    },
    {
      label: "Announcements",
      href: "/admin/announcements",
      desc: "Platform-wide announcements",
    },
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      desc: "Audit trail of sensitive operations",
    },
    {
      label: "Login History",
      href: "/admin/users/login-history",
      desc: "User login records",
    },
    {
      label: "Consent Logs",
      href: "/admin/consent-logs",
      desc: "User consent history",
    },
    {
      label: "Trash",
      href: "/admin/trash",
      desc: "Soft-deleted items with restore",
    },
    {
      label: "Backup & Restore",
      href: "/admin/settings/backup",
      desc: "Create, download, and restore database backups",
    },
    {
      label: "Maintenance Mode",
      href: "/admin/maintenance",
      desc: "Toggle platform-wide maintenance mode",
    },
    {
      label: "Refund Approvals",
      href: "/admin/refunds/approvals",
      desc: "Approve or reject refund requests from admins",
    },
    {
      label: "Session Management",
      href: "/admin/session-management",
      desc: "Monitor and terminate admin sessions (kill button)",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System health monitoring and platform-wide administration.
        </p>
      </div>

      {/* Health Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-card border border-border animate-pulse"
            />
          ))
        ) : health ? (
          <>
            <StatCard
              label="Server Status"
              value={health.status === "ok" ? "Healthy" : "Degraded"}
              status={health.status as "ok" | "degraded"}
            />
            <StatCard
              label="Database"
              value={
                health.database === "connected" ? "Connected" : "Disconnected"
              }
              status={health.database === "connected" ? "ok" : "error"}
            />
            <StatCard label="Uptime" value={formatUptime(health.uptime)} />
            <StatCard
              label="Memory"
              value={`${(health.memory.heapUsed / 1024 / 1024).toFixed(0)} MB`}
            />
          </>
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            Unable to load health data.
          </div>
        )}
      </div>

      {/* Tools */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Administration Tools
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-xl border border-border bg-card p-4 hover:border-border-hover hover:bg-card-hover transition-colors"
            >
              <h3 className="font-medium text-foreground text-sm">
                {tool.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
