"use client";

import { usePageTitle } from "@/lib/use-page-title";
import { ChartSkeleton } from "@/components/admin/LoadingSkeleton";
import { useApiQuery } from "@/lib/query";
import type { DashboardChartData } from "@/lib/api-types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import QuickActionCard from "@/components/admin/QuickActionCard";
import {
  IconBook,
  IconCalendar,
  IconChartPie,
  IconEdit,
  IconHistory,
  IconKey,
  IconLock,
  IconPackage,
  IconSchool,
  IconServer,
  IconSettings,
  IconShield,
  IconTicket,
  IconTrash,
  IconTrendingUp,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
  IconVideo,
} from "@tabler/icons-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * Palette notes:
 * - primary   (indigo)  -> platform / navigation actions, the "brand" hue
 * - accent    (teal)    -> growth / activity metrics, kept distinct from primary
 *                          so charts don't read as one blue blob
 * - success   (green)   -> healthy / approved / online states
 * - warning   (amber)   -> needs attention, but not broken
 * - danger    (coral)   -> broken / high privilege / blocking
 * - violet    (extra)   -> 5th categorical slot for donut charts with >4 series
 * - muted     (slate)   -> secondary text / axis labels
 */
const COLORS = {
  primary: "#4F5FE0",
  accent: "#14B8A6",
  success: "#22A06B",
  warning: "#E0A030",
  danger: "#E0526B",
  violet: "#8B7CF6",
  muted: "#7C88A6",
};

// Ordered for donut/pie legibility: alternating warm/cool so adjacent
// slices never sit next to a near-identical hue.
const PIE_COLORS = [
  COLORS.primary,
  COLORS.warning,
  COLORS.accent,
  COLORS.danger,
  COLORS.violet,
];

// --- Super Admin Dashboard ---
function SuperAdminDashboard() {
  const healthQuery = useApiQuery<{ status: string }>(
    ["admin", "dashboard", "health"],
    "/health",
  );
  const apiKeysQuery = useApiQuery<{ keys: { active: boolean }[] }>(
    ["admin", "dashboard", "api-keys"],
    "/api/admin/api-keys",
  );
  const pendingQuery = useApiQuery<{ users: unknown[] }>(
    ["admin", "dashboard", "pending-instructors"],
    "/api/admin/users/pending",
  );
  const trashQuery = useApiQuery<{ trash: Record<string, unknown[]> }>(
    ["admin", "dashboard", "trash"],
    "/api/admin/trash",
  );
  const logStatsQuery = useApiQuery<{
    stats: { totalLogs: number; failedLogs: number };
  }>(["admin", "dashboard", "log-stats"], "/api/admin/logs/stats");
  const dashStatsQuery = useApiQuery<DashboardChartData>(
    ["admin", "dashboard", "stats"],
    "/api/admin/dashboard/stats",
  );

  const loading =
    healthQuery.isPending ||
    apiKeysQuery.isPending ||
    pendingQuery.isPending ||
    trashQuery.isPending ||
    logStatsQuery.isPending ||
    dashStatsQuery.isPending;

  const dashStats = dashStatsQuery.data ?? null;
  const roleDist = dashStats?.userRoleDistribution ?? [];
  const totalSuperAdmins =
    roleDist.find((r) => r.role === "SUPER_ADMIN")?.count ?? 0;
  const totalAdmins = roleDist.find((r) => r.role === "ADMIN")?.count ?? 0;
  const totalInstructors =
    roleDist.find((r) => r.role === "INSTRUCTOR")?.count ?? 0;
  const totalStudents =
    roleDist.find((r) => r.role === "STUDENT")?.count ?? 0;

  const trashTotal = Object.values(trashQuery.data?.trash ?? {}).reduce(
    (sum: number, arr: unknown[]) => sum + arr.length,
    0,
  );

  const saStats = {
    healthStatus:
      healthQuery.data?.status === "ok" ? ("ok" as const) : ("error" as const),
    totalLogs: logStatsQuery.data?.stats.totalLogs ?? 0,
    failedLogs: logStatsQuery.data?.stats.failedLogs ?? 0,
    apiKeysActive: (apiKeysQuery.data?.keys ?? []).filter((k) => k.active)
      .length,
    pendingInstructors: pendingQuery.data?.users.length ?? 0,
    trashCount: trashTotal,
    loginLogsToday: 0,
    totalSuperAdmins,
    totalAdmins,
    totalInstructors,
    totalStudents,
  };

  const saCards = [
    {
      label: "System Status",
      value: loading
        ? "—"
        : saStats.healthStatus === "ok"
          ? "Healthy"
          : "Degraded",
      icon: IconServer,
      href: "/health",
    },
    {
      label: "Active API Keys",
      value: saStats.apiKeysActive,
      icon: IconKey,
      href: "/admin/settings/api-keys",
    },
    {
      label: "Activity Logs (30d)",
      value: saStats.totalLogs,
      icon: IconHistory,
      href: "/admin/logs",
    },
    {
      label: "Failed Logs (30d)",
      value: saStats.failedLogs,
      icon: IconLock,
      href: "/admin/logs",
    },
    {
      label: "Pending Instructors",
      value: saStats.pendingInstructors,
      icon: IconUserCheck,
      href: "/admin/users?role=INSTRUCTOR",
    },
    {
      label: "Trash Items",
      value: saStats.trashCount,
      icon: IconTrash,
      href: "/admin/trash",
    },
  ];

  const userCards = [
    {
      label: "Super Admins",
      value: saStats.totalSuperAdmins,
      icon: IconShield,
      textColor: "text-danger",
      iconColor: "text-danger",
    },
    {
      label: "Admins",
      value: saStats.totalAdmins,
      icon: IconShield,
      textColor: "text-primary",
      iconColor: "text-primary",
    },
    {
      label: "Instructors",
      value: saStats.totalInstructors,
      icon: IconUsers,
      textColor: "text-accent",
      iconColor: "text-accent",
    },
    {
      label: "Students",
      value: saStats.totalStudents,
      icon: IconSchool,
      textColor: "text-success",
      iconColor: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Banner — top accent bar signals health at a glance */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            saStats.healthStatus === "ok"
              ? "bg-gradient-to-r from-success via-success/70 to-transparent"
              : "bg-gradient-to-r from-danger via-danger/70 to-transparent"
          }`}
        />
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-danger to-danger/70 text-xl font-bold text-white shadow-sm">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-danger">
              Super Admin
            </p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              System Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              System-wide health, security, and operations overview.
            </p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Users
              </p>
              <p className="text-lg font-bold text-primary">
                {loading
                  ? "—"
                  : saStats.totalSuperAdmins +
                    saStats.totalAdmins +
                    saStats.totalInstructors +
                    saStats.totalStudents}
              </p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                System
              </p>
              <p
                className={`text-lg font-bold ${saStats.healthStatus === "ok" ? "text-success" : "text-danger"}`}
              >
                {loading
                  ? "—"
                  : saStats.healthStatus === "ok"
                    ? "Online"
                    : "Issues"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {saCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-border bg-card p-5 hover:border-muted-foreground/30 transition-colors"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-4 animate-pulse bg-border" />
                <div className="h-3 w-24 animate-pulse bg-border" />
                <div className="h-7 w-16 animate-pulse bg-border" />
              </div>
            ) : (
              <>
                <stat.icon
                  size={22}
                  stroke={1.5}
                  className="text-muted-foreground mb-3"
                />
                <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* User Distribution */}
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconUsers size={18} stroke={1.5} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            User Distribution
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {userCards.map((card) => (
            <div
              key={card.label}
              className="border border-border bg-card p-5 text-center transition-colors hover:border-muted-foreground/30"
            >
              <card.icon
                size={28}
                className={`mx-auto mb-2 ${card.iconColor}`}
              />
              <p
                className={`text-3xl font-extrabold tracking-tight ${card.textColor}`}
              >
                {loading ? "—" : card.value}
              </p>
              <p className="text-xs font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionCard
            label="System Settings"
            href="/admin/settings/system"
            icon={IconSettings}
            variant="red"
            description="Configure platform settings"
          />
          <QuickActionCard
            label="API Keys"
            href="/admin/settings/api-keys"
            icon={IconKey}
            variant="amber"
            description="Manage API credentials"
          />
          <QuickActionCard
            label="Trash"
            href="/admin/trash"
            icon={IconTrash}
            variant="amber"
            description="Restore or delete items"
          />
          <QuickActionCard
            label="Login History"
            href="/admin/users/login-history"
            icon={IconHistory}
            variant="teal"
            description="View recent login logs"
          />
        </div>
      </div>
    </div>
  );
}

// --- Admin Dashboard ---
function AdminDashboard() {
  const coursesQuery = useApiQuery<{ total: number }>(
    ["admin", "dashboard", "courses"],
    "/api/admin/courses",
    { limit: "1" },
  );
  const batchesQuery = useApiQuery<{ batches: unknown[] }>(
    ["admin", "dashboard", "batches"],
    "/api/admin/batches",
    { status: "ACTIVE" },
  );
  const sessionsQuery = useApiQuery<{ sessions: unknown[] }>(
    ["admin", "dashboard", "sessions"],
    "/api/sessions",
    { status: "live" },
  );
  const usersQuery = useApiQuery<{
    users: Array<{ role: string }>;
    packages: unknown[];
  }>(["admin", "dashboard", "users"], "/api/users");
  const dashStatsQuery = useApiQuery<DashboardChartData>(
    ["admin", "dashboard", "stats"],
    "/api/admin/dashboard/stats",
  );

  const loading =
    coursesQuery.isPending ||
    batchesQuery.isPending ||
    sessionsQuery.isPending ||
    usersQuery.isPending ||
    dashStatsQuery.isPending;

  const stats = {
    totalCourses: coursesQuery.data ? (coursesQuery.data.total ?? 0) : null,
    activeBatches: batchesQuery.data
      ? (batchesQuery.data.batches?.length ?? 0)
      : null,
    liveSessions: sessionsQuery.data ? sessionsQuery.data.sessions.length : null,
    totalStudents: usersQuery.data
      ? (usersQuery.data.users ?? []).filter((user) => user.role === "STUDENT")
          .length
      : null,
  };

  const chartData = dashStatsQuery.data ?? null;

  const statsCards = [
    {
      label: "Total Courses",
      value: stats.totalCourses,
      icon: IconBook,
      variant: "blue" as const,
      href: "/admin/courses",
    },
    {
      label: "Active Batches",
      value: stats.activeBatches,
      icon: IconUsersGroup,
      variant: "purple" as const,
      href: "/admin/batches",
    },
    {
      label: "Live Sessions",
      value: stats.liveSessions,
      icon: IconVideo,
      variant: "green" as const,
      href: "/admin/sessions",
    },
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: IconSchool,
      variant: "orange" as const,
      href: "/admin/users",
    },
  ];

  const quickActions = [
    {
      label: "Add Course",
      href: "/admin/courses/new",
      icon: IconEdit,
      variant: "blue" as const,
      description: "Create a new course",
    },
    {
      label: "Manage Batches",
      href: "/admin/batches",
      icon: IconUsersGroup,
      variant: "teal" as const,
      description: "View and manage batches",
    },
    {
      label: "Calendar",
      href: "/admin/calendar",
      icon: IconCalendar,
      variant: "blue" as const,
      description: "Schedule and view events",
    },
    {
      label: "View Sessions",
      href: "/admin/sessions",
      icon: IconVideo,
      variant: "green" as const,
      description: "Monitor live sessions",
    },
    {
      label: "Mentorship Tickets",
      href: "/admin/mentorship",
      icon: IconTicket,
      variant: "amber" as const,
      description: "Review mentorship requests",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Platform overview and quick actions."
        breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }]}
        action={
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Students
              </p>
              <p className="text-lg font-bold text-primary">
                {loading ? "\u2014" : (stats.totalStudents ?? "\u2014")}
              </p>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-border bg-card p-5 hover:border-muted-foreground/30 transition-colors"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-4 animate-pulse bg-border" />
                <div className="h-3 w-24 animate-pulse bg-border" />
                <div className="h-7 w-16 animate-pulse bg-border" />
              </div>
            ) : (
              <>
                <stat.icon size={22} stroke={1.5} className="text-muted-foreground mb-3" />
                <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">
                  {stat.value === null ? "\u2014" : String(stat.value)}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Package */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconPackage size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Students per Package
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.studentsPerPackage?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.primary],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: chartData.studentsPerPackage.map(
                    (d) => d.packageName,
                  ),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={[
                {
                  name: "Students",
                  data: chartData.studentsPerPackage.map((d) => d.count),
                },
              ]}
              type="bar"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Enrollment Growth Over Time */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconTrendingUp size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Enrollment Growth
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.enrollmentTrend?.length ? (
            <Chart
              options={{
                chart: {
                  type: "area",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.accent],
                fill: {
                  type: "gradient",
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0,
                  },
                },
                xaxis: {
                  categories: chartData.enrollmentTrend.map((d) => d.month),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                  },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
                stroke: { width: 2 },
              }}
              series={[
                {
                  name: "Enrolled",
                  data: chartData.enrollmentTrend.map((d) => d.count),
                },
              ]}
              type="area"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Batch Status Distribution */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconChartPie size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Batch Distribution
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.batchDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: chartData.batchDistribution.map((b) => b.status),
                plotOptions: {
                  pie: {
                    donut: { size: "65%" },
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  labels: { colors: "var(--muted-foreground)" },
                },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={chartData.batchDistribution.map((b) => b.count)}
              type="donut"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconUsersGroup size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              User Roles
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.userRoleDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: chartData.userRoleDistribution.map((u) => u.role),
                plotOptions: {
                  pie: {
                    donut: { size: "65%" },
                  },
                },
                legend: {
                  position: "bottom",
                  fontSize: "12px",
                  labels: { colors: "var(--muted-foreground)" },
                },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={chartData.userRoleDistribution.map((u) => u.count)}
              type="donut"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Recent Enrollments */}
      {chartData?.recentEnrollments &&
        chartData.recentEnrollments.length > 0 && (
          <div className="border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <IconHistory size={18} stroke={1.5} className="text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Recent Enrollments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Student
                    </th>
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Package
                    </th>
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Status
                    </th>
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Razorpay ID
                    </th>
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Amount
                    </th>
                    <th className="pb-2 text-xs font-medium uppercase text-muted">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.recentEnrollments.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2.5">
                        <p className="font-medium text-foreground">
                          {e.userName}
                        </p>
                        <p className="text-xs text-muted">{e.userEmail}</p>
                      </td>
                      <td className="py-2.5 text-foreground">
                        {e.packageName}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            e.status === "APPROVED"
                              ? "bg-success/15 text-success"
                              : e.status === "PENDING"
                                ? "bg-warning/15 text-warning"
                                : "bg-danger/15 text-danger"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {e.razorpayPaymentId ?? "—"}
                      </td>
                      <td className="py-2.5 text-foreground">
                        {e.amount != null
                          ? `₹${(e.amount / 100).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(e.appliedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Quick Actions */}
      <div className="border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.href}
              label={action.label}
              href={action.href}
              icon={action.icon}
              variant={action.variant}
              description={action.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Root: role-aware dispatcher ---
export default function AdminDashboardPage() {
  usePageTitle("Dashboard");
  const meQuery = useApiQuery<{ user: { role: string } }>(
    ["admin", "dashboard", "me"],
    "/api/auth/me",
  );

  const userRole = meQuery.data?.user?.role ?? null;

  if (meQuery.isPending) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-lg bg-card-hover/60" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-card-hover/60" />
          ))}
        </div>
      </div>
    );
  }

  if (userRole === "SUPER_ADMIN") {
    return <SuperAdminDashboard />;
  }

  return <AdminDashboard />;
}
