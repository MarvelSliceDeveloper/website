"use client";

import { usePageTitle } from "@/lib/use-page-title";
import { ChartSkeleton } from "@/components/admin/LoadingSkeleton";
import { useApiQuery } from "@/lib/query";
import type { DashboardChartData } from "@/lib/api-types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import QuickActionCard from "@/components/admin/QuickActionCard";
import StatCard from "@/components/admin/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  IconBook,
  IconCalendar,
  IconChartPie,
  IconChevronRight,
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
  const totalStudents = roleDist.find((r) => r.role === "STUDENT")?.count ?? 0;

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

  const saCards: Array<{
    label: string;
    value: string | number;
    icon: typeof IconServer;
    href: string;
    variant: "blue" | "green" | "orange" | "red" | "purple";
  }> = [
    {
      label: "System Status",
      value: loading
        ? "—"
        : saStats.healthStatus === "ok"
          ? "Healthy"
          : "Degraded",
      icon: IconServer,
      href: "/health",
      variant: saStats.healthStatus === "ok" ? "green" : "red",
    },
    {
      label: "Active API Keys",
      value: saStats.apiKeysActive,
      icon: IconKey,
      href: "/admin/settings/api-keys",
      variant: "purple",
    },
    {
      label: "Activity Logs (30d)",
      value: saStats.totalLogs,
      icon: IconHistory,
      href: "/admin/logs",
      variant: "blue",
    },
    {
      label: "Failed Logs (30d)",
      value: saStats.failedLogs,
      icon: IconLock,
      href: "/admin/logs",
      variant: "red",
    },
    {
      label: "Pending Instructors",
      value: saStats.pendingInstructors,
      icon: IconUserCheck,
      href: "/admin/users?role=INSTRUCTOR",
      variant: "orange",
    },
    {
      label: "Trash Items",
      value: saStats.trashCount,
      icon: IconTrash,
      href: "/admin/trash",
      variant: "red",
    },
  ];

  const userCards = [
    {
      label: "Super Admins",
      value: saStats.totalSuperAdmins,
      icon: IconShield,
      textColor: "text-danger",
      iconBg: "bg-danger/10 text-danger",
      border: "hover:border-danger/40",
    },
    {
      label: "Admins",
      value: saStats.totalAdmins,
      icon: IconShield,
      textColor: "text-primary",
      iconBg: "bg-primary/10 text-primary",
      border: "hover:border-primary/40",
    },
    {
      label: "Instructors",
      value: saStats.totalInstructors,
      icon: IconUsers,
      textColor: "text-accent",
      iconBg: "bg-accent/10 text-accent",
      border: "hover:border-accent/40",
    },
    {
      label: "Students",
      value: saStats.totalStudents,
      icon: IconSchool,
      textColor: "text-success",
      iconBg: "bg-success/10 text-success",
      border: "hover:border-success/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            saStats.healthStatus === "ok"
              ? "bg-gradient-to-r from-success via-success/70 to-transparent"
              : "bg-gradient-to-r from-danger via-danger/70 to-transparent"
          }`}
        />
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-danger to-danger/80 text-xl font-black text-white shadow-md shadow-danger/20">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm" dot>Super Admin</Badge>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              System Dashboard
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              System-wide health, security, and operations overview.
            </p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                System
              </p>
              <Badge
                variant={saStats.healthStatus === "ok" ? "success" : "danger"}
                size="md"
                dot
              >
                {loading
                  ? "Checking"
                  : saStats.healthStatus === "ok"
                    ? "Online"
                    : "Issues"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {saCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            href={stat.href}
            variant={stat.variant}
            loading={loading}
          />
        ))}
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconUsers size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-base font-semibold">
              User Distribution
            </CardTitle>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Manage Users
            <IconChevronRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {userCards.map((card) => (
              <Card
                key={card.label}
                hoverable
                className={`p-4 text-center transition-all ${card.border}`}
              >
                <div
                  className={`mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <card.icon size={20} stroke={1.8} />
                </div>
                <p
                  className={`text-2xl font-extrabold tracking-tight ${card.textColor}`}
                >
                  {loading ? "—" : card.value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
    liveSessions: sessionsQuery.data
      ? sessionsQuery.data.sessions.length
      : null,
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Students
              </p>
              <p className="text-lg font-bold text-primary">
                {loading ? "—" : (stats.totalStudents ?? "—")}
              </p>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            href={stat.href}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Package */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconPackage size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-base font-semibold">
              Students per Package
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
                  plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
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
                  grid: { borderColor: "var(--border)", strokeDashArray: 4 },
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
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No package data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Growth Over Time */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconTrendingUp size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-base font-semibold">
              Enrollment Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
                      opacityFrom: 0.35,
                      opacityTo: 0.05,
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
                  grid: { borderColor: "var(--border)", strokeDashArray: 4 },
                  tooltip: { theme: "light" },
                  dataLabels: { enabled: false },
                  stroke: { width: 2.5, curve: "smooth" },
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
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Status Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <IconChartPie size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-base font-semibold">
              Batch Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No batch data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconUsersGroup size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-base font-semibold">
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
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
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Enrollments */}
      {chartData?.recentEnrollments &&
        chartData.recentEnrollments.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconHistory size={18} stroke={1.8} />
                </div>
                <CardTitle className="text-base font-semibold">
                  Recent Enrollments
                </CardTitle>
              </div>
              <Link
                href="/admin/enrollments"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View all
                <IconChevronRight size={14} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/15 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Student
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Package
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Razorpay ID
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {chartData.recentEnrollments.map((e) => (
                      <tr
                        key={e.id}
                        className="transition-colors hover:bg-muted/10"
                      >
                        <td className="px-5 py-3">
                          <p className="font-semibold text-foreground">
                            {e.userName}
                          </p>
                          <p className="text-xs text-muted-foreground">{e.userEmail}</p>
                        </td>
                        <td className="px-5 py-3 text-foreground font-medium">
                          {e.packageName}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={
                              e.status === "APPROVED"
                                ? "success"
                                : e.status === "PENDING"
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                            dot
                          >
                            {e.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {e.razorpayPaymentId ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {e.amount != null
                            ? `₹${(e.amount / 100).toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
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
            </CardContent>
          </Card>
        )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
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
