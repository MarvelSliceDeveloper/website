"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MOCK_DASHBOARD_CHARTS, MOCK_ENABLED } from "@/lib/student-mock-data";
import type { DashboardChartData } from "@/lib/student-mock-data";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

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
        const res = await api.get<DashboardChartData>(
          "/api/admin/dashboard/stats",
        );
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Analytics
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed analytics and insights across the platform.
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Students per Course */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Students per Course
          </h3>
          {data?.studentsPerCourse?.length ? (
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
                  categories: data.studentsPerCourse.map((d) => d.courseTitle),
                  labels: {
                    style: { colors: "var(--muted)", fontSize: "11px" },
                    rotate: -20,
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
                  data: data.studentsPerCourse.map((d) => d.count),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Enrollment Growth */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Enrollment Growth Over Time
          </h3>
          {data?.enrollmentTrend?.length ? (
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
                  categories: data.enrollmentTrend.map((d) => d.month),
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
                  data: data.enrollmentTrend.map((d) => d.count),
                },
              ]}
              type="area"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Batch Distribution */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Batch Distribution
          </h3>
          {data?.batchDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: data.batchDistribution.map((b) => b.status),
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
              series={data.batchDistribution.map((b) => b.count)}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* User Role Distribution */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            User Roles
          </h3>
          {data?.userRoleDistribution?.length ? (
            <Chart
              options={{
                chart: {
                  type: "donut",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: PIE_COLORS,
                labels: data.userRoleDistribution.map((u) => u.role),
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
              series={data.userRoleDistribution.map((u) => u.count)}
              type="donut"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>

        {/* Top Courses */}
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Top Courses by Enrollment
          </h3>
          {data?.topCourses?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.accent],
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    horizontal: true,
                  },
                },
                xaxis: {
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
                  name: "Enrolled",
                  data: data.topCourses.map((d) => ({
                    x: d.courseTitle,
                    y: d.enrollmentCount,
                  })),
                },
              ]}
              type="bar"
              height={300}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — Revenue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        <div className="border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Monthly Revenue
          </h3>
          {data?.revenueTrend?.length ? (
            <Chart
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.success],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: data.revenueTrend.map((d) => d.month),
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
                  name: "Revenue (₹)",
                  data: data.revenueTrend.map((d) => d.total),
                },
              ]}
              type="bar"
              height={320}
            />
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
