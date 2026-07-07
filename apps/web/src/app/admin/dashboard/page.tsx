"use client";

import StatCard from "@/components/admin/StatCard";
import { ChartSkeleton } from "@/components/admin/LoadingSkeleton";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MOCK_DASHBOARD_CHARTS, MOCK_ENABLED } from "@/lib/admin-mock-data";
import type { DashboardChartData } from "@/lib/admin-mock-data";
import dynamic from "next/dynamic";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconBook,
  IconVideo,
  IconSchool,
  IconTrendingUp,
  IconChartPie,
  IconCurrencyDollar,
} from "@tabler/icons-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const COLORS = {
  primary: "#6d7dff",
  accent: "#25c0e8",
  success: "#2fbf71",
  warning: "#f5ad42",
  danger: "#f05d7d",
  muted: "#8b93ae",
};

const PIE_COLORS = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.danger];

export default function AdminDashboardPage() {
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
      if (MOCK_ENABLED) {
        const activeBatches =
          MOCK_DASHBOARD_CHARTS.batchDistribution.find(
            (batch) => batch.status === "ACTIVE",
          )?.count ?? 0;
        const totalStudents = MOCK_DASHBOARD_CHARTS.studentsPerCourse.reduce(
          (sum, course) => sum + course.count,
          0,
        );

        setChartData(MOCK_DASHBOARD_CHARTS);
        setStats({
          totalCourses: MOCK_DASHBOARD_CHARTS.studentsPerCourse.length,
          activeBatches,
          liveSessions: 0,
          totalStudents,
        });
        setLoading(false);
        return;
      }

      try {
        const [
          coursesRes,
          activeBatchesRes,
          sessionsRes,
          usersRes,
          dashboardRes,
        ] = await Promise.allSettled([
          api.get<{ total: number }>("/api/admin/courses", { limit: "1" }),
          api.get<unknown[]>("/api/admin/batches", { status: "ACTIVE" }),
          api.get<{ sessions: unknown[] }>("/api/sessions", { status: "live" }),
          api.get<Array<{ role: string }>>("/api/users"),
          api.get<DashboardChartData>("/api/admin/dashboard/stats"),
        ]);

        setStats({
          totalCourses:
            coursesRes.status === "fulfilled" ? coursesRes.value.total : 0,
          activeBatches:
            activeBatchesRes.status === "fulfilled"
              ? activeBatchesRes.value.length
              : 0,
          liveSessions:
            sessionsRes.status === "fulfilled"
              ? sessionsRes.value.sessions.length
              : 0,
          totalStudents:
            usersRes.status === "fulfilled"
              ? usersRes.value.filter((user) => user.role === "STUDENT").length
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

  const totalRevenue =
    chartData?.revenueTrend?.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Platform overview and quick actions."
        action={
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Revenue
              </p>
              <p className="text-lg font-bold text-success">
                {loading ? "\u2014" : `\u20B9${(totalRevenue / 1000).toFixed(0)}k`}
              </p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Students
              </p>
              <p className="text-lg font-bold text-primary">
                {loading ? "\u2014" : stats.totalStudents ?? "\u2014"}
              </p>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Course */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconBook size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Students per Course
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.studentsPerCourse?.length ? (
            <Chart
              options={{
                chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                colors: [COLORS.primary],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: chartData.studentsPerCourse.map((d) => d.courseTitle),
                  labels: { style: { colors: "var(--muted)", fontSize: "11px" } },
                },
                yaxis: { labels: { style: { colors: "var(--muted)", fontSize: "11px" } } },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={[{ name: "Students", data: chartData.studentsPerCourse.map((d) => d.count) }]}
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
                colors: [COLORS.primary],
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
                  labels: { style: { colors: "var(--muted)", fontSize: "11px" } },
                },
                yaxis: { labels: { style: { colors: "var(--muted)", fontSize: "11px" } } },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
                stroke: { width: 2 },
              }}
              series={[{ name: "Enrolled", data: chartData.enrollmentTrend.map((d) => d.count) }]}
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
                chart: { type: "donut", toolbar: { show: false }, fontFamily: "inherit" },
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

        {/* Monthly Revenue */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconCurrencyDollar size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Monthly Revenue
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.revenueTrend?.length ? (
            <Chart
              options={{
                chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                colors: [COLORS.success],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: chartData.revenueTrend.map((d) => d.month),
                  labels: { style: { colors: "var(--muted)", fontSize: "11px" } },
                },
                yaxis: {
                  labels: { style: { colors: "var(--muted)", fontSize: "11px" } },
                },
                grid: { borderColor: "var(--border)" },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={[{ name: "Revenue", data: chartData.revenueTrend.map((d) => d.total) }]}
              type="bar"
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
