"use client";

import Link from "next/link";
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

const quickActions = [
  { label: "Create Course", href: "/admin/courses/new", icon: "📝" },
  { label: "Manage Batches", href: "/admin/batches", icon: "👥" },
  { label: "View Sessions", href: "/admin/sessions", icon: "📅" },
  { label: "Mentorship Tickets", href: "/admin/mentorship", icon: "🎫" },
];

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
        const activeBatches = MOCK_DASHBOARD_CHARTS.batchDistribution.find((batch) => batch.status === "ACTIVE")?.count ?? 0;
        const totalStudents = MOCK_DASHBOARD_CHARTS.studentsPerCourse.reduce((sum, course) => sum + course.count, 0);

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
        const [coursesRes, activeBatchesRes, sessionsRes, usersRes, dashboardRes] =
          await Promise.allSettled([
            api.get<{ total: number }>("/api/admin/courses", { limit: "1" }),
            api.get<unknown[]>("/api/admin/batches", { status: "ACTIVE" }),
            api.get<{ sessions: unknown[] }>("/api/sessions", { status: "live" }),
            api.get<Array<{ role: string }>>("/api/users"),
            api.get<DashboardChartData>("/api/admin/dashboard/stats"),
          ]);

        setStats({
          totalCourses: coursesRes.status === "fulfilled" ? coursesRes.value.total : 0,
          activeBatches: activeBatchesRes.status === "fulfilled" ? activeBatchesRes.value.length : 0,
          liveSessions: sessionsRes.status === "fulfilled" ? sessionsRes.value.sessions.length : 0,
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
        setStats({ totalCourses: 0, activeBatches: 0, liveSessions: 0, totalStudents: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statsCards = [
    { label: "Total Courses", value: stats.totalCourses, icon: "📚", color: "from-primary to-violet-500", href: "/admin/courses" },
    { label: "Active Batches", value: stats.activeBatches, icon: "👥", color: "from-accent to-cyan-400", href: "/admin/batches" },
    { label: "Live Sessions", value: stats.liveSessions, icon: "🎥", color: "from-success to-emerald-400", href: "/admin/sessions" },
    { label: "Total Students", value: stats.totalStudents, icon: "🎓", color: "from-warning to-amber-400", href: "/admin/users" },
  ];

  const formatStatValue = (value: number | null) => (value === null ? "—" : value.toString());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card !p-3 text-sm">
          <p className="font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="text-muted-foreground">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and quick actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="glass-card p-5 group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{formatStatValue(stat.value)}</p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-lg group-hover:scale-110 transition-transform`}
              >
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Course */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Students per Course</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : chartData?.studentsPerCourse?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.studentsPerCourse} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
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
                <Bar dataKey="count" name="Students" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Enrollment Growth Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Enrollment Growth</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : chartData?.enrollmentTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData.enrollmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} />
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
            <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Batch Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Batch Distribution</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : chartData?.batchDistribution?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.batchDistribution.map((b) => ({ name: b.status, value: b.count }))}
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
                  wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--muted-foreground)" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Monthly Revenue</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : chartData?.revenueTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Revenue" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="panel p-4 text-center hover:border-primary/30 hover:bg-card-hover transition-all group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
