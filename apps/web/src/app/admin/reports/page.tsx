"use client";

import { useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TIME_RANGES, useReportData } from "@/lib/report-utils";
import ReportExportDropdown from "./_components/ReportExportDropdown";
import TimeRangeFilter from "./_components/TimeRangeFilter";
import KpiCards from "./_components/KpiCards";
import EnrollmentSection from "./_components/EnrollmentSection";
import RecentTransactions from "./_components/RecentTransactions";

export default function ReportsOverviewPage() {
  usePageTitle("Reports");
  const [timeRange, setTimeRange] = useState("all");
  const { data, prevData, loading, refetch } = useReportData(timeRange);

  const periodLabel =
    timeRange === "all"
      ? "All Time"
      : (TIME_RANGES.find((t) => t.value === timeRange)?.label ?? timeRange);
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Derived values ──
  const courseLabels = (data?.studentsPerCourse ?? []).map((d) => d.courseTitle);
  const courseVals = (data?.studentsPerCourse ?? []).map((d) => d.count);
  const revenueVals = (data?.monthlyRevenue ?? []).map((d) => d.amount);
  const paymentStatusRows = data?.paymentStatusDistribution ?? [];

  const totalStudents =
    (data?.userRoleDistribution ?? []).find((u) => u.role === "STUDENT")?.count ??
    0;
  const totalRevenue = revenueVals.reduce((a, b) => a + b, 0);
  const derivedArpu =
    data?.arpu ?? (totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0);
  const refundRow = paymentStatusRows.find((p) => p.status === "REFUNDED");
  const derivedRefundRate = data?.refundRate ?? (refundRow ? refundRow.count : 0);

  const kpis = [
    {
      label: "Total Learners",
      value: totalStudents,
      prev:
        (prevData?.userRoleDistribution ?? []).find(
          (u) => u.role === "STUDENT",
        )?.count ?? null,
    },
    {
      label: "Courses",
      value: courseLabels.length,
      prev: (prevData?.studentsPerCourse ?? []).length || null,
    },
    {
      label: "Revenue",
      value: totalRevenue,
      prev:
        (prevData?.monthlyRevenue ?? []).reduce((a, b) => a + b.amount, 0) ||
        null,
      isCurrency: true,
    },
    {
      label: "Active Batches",
      value:
        (data?.batchDistribution ?? []).find((b) => b.status === "ACTIVE")
          ?.count ?? 0,
      prev:
        (prevData?.batchDistribution ?? []).find((b) => b.status === "ACTIVE")
          ?.count ?? null,
    },
    {
      label: "ARPU",
      value: derivedArpu,
      isCurrency: true,
    },
    {
      label: "Refund Rate",
      value: derivedRefundRate,
      suffix: "%",
    },
    {
      label: "Pending Payments",
      value:
        paymentStatusRows.find((p) => p.status === "PENDING")?.count ?? 0,
    },
    {
      label: "Total Enrollments",
      value: courseVals.reduce((a, b) => a + b, 0),
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Reports"
        description="Enrollment, course performance, revenue, and payment analytics in one view."
        breadcrumbs={[{ label: "Reports", href: "/admin/reports" }]}
        role="Analytics"
        action={
          <ReportExportDropdown
            data={data}
            scope="overview"
            timeRange={timeRange}
            periodLabel={periodLabel}
            generatedDate={generatedDate}
            pdfLabel="Download Report PDF"
          />
        }
      />

      <TimeRangeFilter
        timeRange={timeRange}
        onChange={setTimeRange}
        onRefresh={refetch}
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          Loading...
        </div>
      )}

      <KpiCards kpis={kpis} />

      <EnrollmentSection data={data} timeRange={timeRange} />

      <RecentTransactions data={data} />
    </div>
  );
}
