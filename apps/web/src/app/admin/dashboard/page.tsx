"use client";

import { usePageTitle } from "@/lib/use-page-title";
import { ChartSkeleton } from "@/components/admin/LoadingSkeleton";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardChartData } from "@/lib/api-types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
  const [saStats, setSaStats] = useState({
    healthStatus: "checking" as "ok" | "error" | "checking",
    totalLogs: 0,
    failedLogs: 0,
    apiKeysActive: 0,
    pendingInstructors: 0,
    trashCount: 0,
    loginLogsToday: 0,
    totalAdmins: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalSuperAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [
          healthRes,
          apiKeysRes,
          pendingRes,
          trashRes,
          logStatsRes,
          statsRes,
        ] = await Promise.allSettled([
          api.get<{ status: string }>("/health"),
          api.get<{ keys: { active: boolean }[] }>("/api/admin/api-keys"),
          api.get<{ users: unknown[] }>("/api/admin/users/pending"),
          api.get<{ trash: Record<string, unknown[]> }>("/api/admin/trash"),
          api.get<{ stats: { totalLogs: number; failedLogs: number } }>(
            "/api/admin/logs/stats",
          ),
          api.get<DashboardChartData>("/api/admin/dashboard/stats"),
        ]);

        const healthOk =
          healthRes.status === "fulfilled" && healthRes.value.status === "ok";
        const keys =
          apiKeysRes.status === "fulfilled" ? apiKeysRes.value.keys : [];
        const pending =
          pendingRes.status === "fulfilled" ? pendingRes.value.users : [];
        const trash =
          trashRes.status === "fulfilled" ? trashRes.value.trash : {};
        const logStats =
          logStatsRes.status === "fulfilled" ? logStatsRes.value.stats : null;
        const dashStats =
          statsRes.status === "fulfilled" ? statsRes.value : null;

        const roleDist = dashStats?.userRoleDistribution ?? [];
        const totalSuperAdmins =
          roleDist.find((r) => r.role === "SUPER_ADMIN")?.count ?? 0;
        const totalAdmins =
          roleDist.find((r) => r.role === "ADMIN")?.count ?? 0;
        const totalInstructors =
          roleDist.find((r) => r.role === "INSTRUCTOR")?.count ?? 0;
        const totalStudents =
          roleDist.find((r) => r.role === "STUDENT")?.count ?? 0;

        const trashTotal = Object.values(trash).reduce(
          (sum: number, arr: unknown[]) => sum + arr.length,
          0,
        );

        setSaStats({
          healthStatus: healthOk ? "ok" : "error",
          totalLogs: logStats?.totalLogs ?? 0,
          failedLogs: logStats?.failedLogs ?? 0,
          apiKeysActive: keys.filter((k) => k.active).length,
          pendingInstructors: pending.length,
          trashCount: trashTotal,
          loginLogsToday: 0,
          totalSuperAdmins,
          totalAdmins,
          totalInstructors,
          totalStudents,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <Link
            href="/admin/settings/system"
            className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-danger/15 text-danger border border-danger/20 group-hover:scale-110 transition-transform">
              <IconSettings size={20} stroke={1.8} />
            </div>
            <p className="text-sm font-medium text-foreground">
              System Settings
            </p>
          </Link>
          <Link
            href="/admin/settings/api-keys"
            className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/20 group-hover:scale-110 transition-transform">
              <IconKey size={20} stroke={1.8} />
            </div>
            <p className="text-sm font-medium text-foreground">API Keys</p>
          </Link>
          <Link
            href="/admin/trash"
            className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/20 group-hover:scale-110 transition-transform">
              <IconTrash size={20} stroke={1.8} />
            </div>
            <p className="text-sm font-medium text-foreground">Trash</p>
          </Link>
          <Link
            href="/admin/users/login-history"
            className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20 group-hover:scale-110 transition-transform">
              <IconHistory size={20} stroke={1.8} />
            </div>
            <p className="text-sm font-medium text-foreground">Login History</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Admin Dashboard ---
function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: null as number | null,
    activeBatches: null as number | null,
    liveSessions: null as number | null,
    totalStudents: null as number | null,
  });

  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          coursesRes,
          activeBatchesRes,
          sessionsRes,
          usersRes,
          dashboardRes,
        ] = await Promise.allSettled([
          api.get<{ total: number }>("/api/admin/courses", { limit: "1" }),
          api.get<{ batches: unknown[] }>("/api/admin/batches", { status: "ACTIVE" }),
          api.get<{ sessions: unknown[] }>("/api/sessions", { status: "live" }),
          api.get<{ users: Array<{ role: string }>; packages: unknown[] }>(
            "/api/users",
          ),
          api.get<DashboardChartData>("/api/admin/dashboard/stats"),
        ]);

        setStats({
          totalCourses:
            coursesRes.status === "fulfilled" ? coursesRes.value.total : 0,
          activeBatches:
            activeBatchesRes.status === "fulfilled"
              ? activeBatchesRes.value.batches?.length ?? 0
              : 0,
          liveSessions:
            sessionsRes.status === "fulfilled"
              ? sessionsRes.value.sessions.length
              : 0,
          totalStudents:
            usersRes.status === "fulfilled"
              ? usersRes.value.users.filter((user) => user.role === "STUDENT")
                  .length
              : 0,
        });

        if (dashboardRes.status === "fulfilled") {
          setChartData(dashboardRes.value);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
        setStats({
          totalCourses: 0,
          activeBatches: 0,
          liveSessions: 0,
          totalStudents: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

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
      color: "bg-primary/15 text-primary border border-primary/20",
    },
    {
      label: "Manage Batches",
      href: "/admin/batches",
      icon: IconUsersGroup,
      color: "bg-accent/15 text-accent border border-accent/20",
    },
    {
      label: "Calendar",
      href: "/admin/calendar",
      icon: IconCalendar,
      color: "bg-primary/15 text-primary border border-primary/20",
    },
    {
      label: "View Sessions",
      href: "/admin/sessions",
      icon: IconVideo,
      color: "bg-success/15 text-success border border-success/20",
    },
    {
      label: "Mentorship Tickets",
      href: "/admin/mentorship",
      icon: IconTicket,
      color: "bg-warning/15 text-warning border border-warning/20",
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
            >
              <div
                className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.color} group-hover:scale-110 transition-transform`}
              >
                <action.icon size={20} stroke={1.8} />
              </div>
              <p className="text-sm font-medium text-foreground">
                {action.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Root: role-aware dispatcher ---
export default function AdminDashboardPage() {
  usePageTitle("Dashboard");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: { role: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          setUserRole(res.user.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
