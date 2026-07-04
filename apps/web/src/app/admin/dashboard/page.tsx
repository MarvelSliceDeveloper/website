"use client";

import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { ChartSkeleton } from "@/components/admin/LoadingSkeleton";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MOCK_DASHBOARD_CHARTS, MOCK_ENABLED } from "@/lib/student-mock-data";
import type { DashboardChartData } from "@/lib/student-mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  IconEdit,
  IconUsersGroup,
  IconCalendar,
  IconTicket,
  IconBook,
  IconVideo,
  IconSchool,
  IconTrendingUp,
  IconChartPie,
  IconCurrencyDollar,
} from "@tabler/icons-react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card !p-3 text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((entry, i) => (
          <p
            key={i}
            style={{ color: entry.color }}
            className="text-muted-foreground"
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const quickActions = [
  {
    label: "Create Course",
    href: "/admin/courses/new",
    icon: IconEdit,
    gradient: "from-primary to-violet-500",
  },
  {
    label: "Manage Batches",
    href: "/admin/batches",
    icon: IconUsersGroup,
    gradient: "from-accent to-cyan-400",
  },
  {
    label: "View Sessions",
    href: "/admin/sessions",
    icon: IconCalendar,
    gradient: "from-success to-emerald-400",
  },
  {
    label: "Mentorship Tickets",
    href: "/admin/mentorship",
    icon: IconTicket,
    gradient: "from-warning to-amber-400",
  },
];

const COLORS = {
  primary: "#6d7dff",
  accent: "#25c0e8",
  success: "#2fbf71",
  warning: "#f5ad42",
  danger: "#f05d7d",
  muted: "#8b93ae",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
];

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
      gradient: "from-primary to-violet-500",
      href: "/admin/courses",
    },
    {
      label: "Active Batches",
      value: stats.activeBatches,
      icon: IconUsersGroup,
      gradient: "from-accent to-cyan-400",
      href: "/admin/batches",
    },
    {
      label: "Live Sessions",
      value: stats.liveSessions,
      icon: IconVideo,
      gradient: "from-success to-emerald-400",
      href: "/admin/sessions",
    },
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: IconSchool,
      gradient: "from-warning to-amber-400",
      href: "/admin/users",
    },
  ];

  const totalRevenue = chartData?.revenueTrend?.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/15 via-primary/5 to-accent/10 p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,125,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-xl font-bold text-white shadow-lg shadow-primary/30">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Dashboard</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Platform overview and quick actions.</p>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-success">
                {loading ? "\u2014" : `\u20B9${(totalRevenue / 1000).toFixed(0)}k`}
              </p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Students</p>
              <p className="text-lg font-bold text-primary">
                {loading ? "\u2014" : stats.totalStudents ?? "\u2014"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-2 [&>*]:duration-400">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Course */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconBook size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Students per Course
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.studentsPerCourse?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData.studentsPerCourse}
                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="courseTitle"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Students"
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Enrollment Growth Over Time */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconTrendingUp size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Enrollment Growth
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.enrollmentTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData.enrollmentTrend}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Enrolled"
                  stroke={COLORS.primary}
                  fill="url(#enrollGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Batch Status Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconChartPie size={18} stroke={1.5} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Batch Distribution
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.batchDistribution?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.batchDistribution.map((b) => ({
                    name: b.status,
                    value: b.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.batchDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    color: "var(--muted-foreground)",
                  }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconCurrencyDollar
              size={18}
              stroke={1.5}
              className="text-primary"
            />
            <h3 className="text-base font-semibold text-foreground">
              Monthly Revenue
            </h3>
          </div>
          {loading ? (
            <ChartSkeleton height={280} />
          ) : chartData?.revenueTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData.revenueTrend}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total"
                  name="Revenue"
                  fill={COLORS.success}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="glass-card p-4 text-center hover:border-primary/30 transition-all group cursor-pointer"
            >
              <div
                className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white group-hover:scale-110 transition-transform`}
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
