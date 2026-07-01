"use client";

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

const COLORS = {
  primary: "#6d7dff",
  accent: "#25c0e8",
  success: "#2fbf71",
  warning: "#f5ad42",
  danger: "#f05d7d",
  muted: "#8b93ae",
};
const PIE_COLORS = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.danger];

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card !p-3 text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((entry, i: number) => (
          <p key={i} style={{ color: entry.color }} className="text-muted-foreground">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [data, setData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (MOCK_ENABLED) {
        setData(MOCK_DASHBOARD_CHARTS);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get<DashboardChartData>("/api/admin/dashboard/stats");
        setData(res);
      } catch (e) {
        console.error("Failed to load report data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Analytics</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Detailed analytics and insights across the platform.</p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Course */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Students per Course</h3>
          {data?.studentsPerCourse?.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.studentsPerCourse} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="courseTitle" tick={{ fill: "var(--muted)", fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Enrollment Growth */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Enrollment Growth Over Time</h3>
          {data?.enrollmentTrend?.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.enrollmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                <Area type="monotone" dataKey="count" name="Enrolled" stroke={COLORS.primary} fill="url(#enrollGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Batch Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Batch Distribution</h3>
          {data?.batchDistribution?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.batchDistribution.map((b) => ({ name: b.status, value: b.count }))}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                >
                  {data.batchDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                  formatter={(value: string) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">User Roles</h3>
          {data?.userRoleDistribution?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.userRoleDistribution.map((u) => ({ name: u.role, value: u.count }))}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                >
                  {data.userRoleDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                  formatter={(value: string) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Top Courses */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Courses by Enrollment</h3>
          {data?.topCourses?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topCourses} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis type="category" dataKey="courseTitle" tick={{ fill: "var(--muted)", fontSize: 11 }} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="enrollmentCount" name="Enrolled" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* Row 3 — Revenue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Monthly Revenue</h3>
          {data?.revenueTrend?.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Revenue (₹)" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
