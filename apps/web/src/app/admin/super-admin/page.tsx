"use client";

import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import Link from "next/link";
import GradientStatCard from "@/components/admin/GradientStatCard";

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  memory: { rss: number; heapTotal: number; heapUsed: number };
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
    {
      label: "Version",
      href: "/admin/version",
      desc: "App version, build info & changelog",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
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
            <GradientStatCard
              label="Server Status"
              value={health.status === "ok" ? "Healthy" : "Degraded"}
              tone={health.status === "ok" ? "teal" : "orange"}
            />
            <GradientStatCard
              label="Database"
              value={
                health.database === "connected" ? "Connected" : "Disconnected"
              }
              tone={health.database === "connected" ? "teal" : "pink"}
            />
            <GradientStatCard
              label="Uptime"
              value={formatUptime(health.uptime)}
              tone="blue"
            />
            <GradientStatCard
              label="Memory"
              value={`${(health.memory.heapUsed / 1024 / 1024).toFixed(0)} MB`}
              tone="purple"
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
