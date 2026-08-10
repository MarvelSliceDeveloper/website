"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconDownload, IconCalendar, IconRefresh } from "@tabler/icons-react";
import {
  COLORS,
  PAYMENT_STATUS_COLORS,
  TIME_RANGES,
  formatINR,
  pctChange,
  drawBarChart,
  drawArea,
  drawDonut,
  ReportPdfBuilder,
  useReportData,
} from "@/lib/report-utils";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReportsPage() {
  usePageTitle("Reports");
  const [timeRange, setTimeRange] = useState("all");
  const [downloading, setDownloading] = useState(false);
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

  // ── Course derived values ──
  const pkgLabels = (data?.studentsPerPackage ?? []).map((d) => d.packageName);
  const pkgVals = (data?.studentsPerPackage ?? []).map((d) => d.count);
  const courseLabels = (data?.studentsPerCourse ?? []).map((d) => d.courseTitle);
  const courseVals = (data?.studentsPerCourse ?? []).map((d) => d.count);
  const growthLabels = (data?.enrollmentTrend ?? []).map((d) => d.month);
  const growthVals = (data?.enrollmentTrend ?? []).map((d) => d.count);

  const completionRows = data?.courseCompletion ?? [];
  const completionLabels = completionRows.map((d) => d.courseTitle);
  const completionRates = completionRows.map((d) =>
    d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0,
  );

  // ── Payment derived values ──
  const revenueLabels = (data?.monthlyRevenue ?? []).map((d) => d.month);
  const revenueVals = (data?.monthlyRevenue ?? []).map((d) => d.amount);
  const revPkgLabels = (data?.revenueByPackage ?? []).map((d) => d.packageName);
  const revPkgVals = (data?.revenueByPackage ?? []).map((d) => d.total);
  const paymentStatusRows = data?.paymentStatusDistribution ?? [];
  const paymentStatusLabels = paymentStatusRows.map((d) => d.status);
  const paymentStatusCounts = paymentStatusRows.map((d) => d.count);

  // ── Shared KPIs ──
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

  // ── Combined PDF report ──
  const handleDownloadPDF = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const pdf = new ReportPdfBuilder();

      const totalPackages = pkgLabels.length;
      const totalCourseEnrollments = courseVals.reduce((a, b) => a + b, 0);
      const avgCompletionRate = completionRates.length
        ? Math.round(
            completionRates.reduce((a, b) => a + b, 0) /
              completionRates.length,
          )
        : null;

      // 1. Course Overview
      pdf.sectionHeader("1. Course Overview");
      pdf.metricCards([
        { label: "Courses", value: String(courseLabels.length) },
        { label: "Packages", value: String(totalPackages) },
        { label: "Total Enrollments", value: String(totalCourseEnrollments) },
        {
          label: "Avg. Completion",
          value: avgCompletionRate !== null ? `${avgCompletionRate}%` : "—",
        },
      ]);
      pdf.paragraph(
        `This report covers course and payment activity${
          timeRange === "all" ? "" : ` for the period "${periodLabel}"`
        }. ` +
          `${courseLabels.length} course(s) are offered across ${totalPackages} package(s), with ${totalCourseEnrollments} total enrollment(s) recorded.`,
      );

      if (courseVals.length) {
        const topIdx = courseVals.indexOf(Math.max(...courseVals));
        const insights = [
          `"${courseLabels[topIdx]}" leads enrollment with ${courseVals[topIdx]} student(s).`,
        ];
        if (completionRates.length) {
          const bestIdx = completionRates.indexOf(Math.max(...completionRates));
          const worstIdx = completionRates.indexOf(Math.min(...completionRates));
          insights.push(
            `"${completionLabels[bestIdx]}" has the highest completion rate at ${completionRates[bestIdx]}%.`,
          );
          insights.push(
            `"${completionLabels[worstIdx]}" has the lowest completion rate at ${completionRates[worstIdx]}%, and may need attention.`,
          );
        }
        pdf.bulletList(insights);
      }

      // 2. Students per Course
      pdf.sectionHeader("2. Students per Course");
      if (courseVals.length) {
        const img = drawBarChart(courseLabels, courseVals, COLORS.accent);
        pdf.image(img, 700, 340);
        pdf.table(
          ["Course", "Students"],
          data.studentsPerCourse!.map((d) => [
            d.courseTitle,
            String(d.count),
          ]),
        );
      } else {
        pdf.noData();
      }

      // 3. Course Completion Rates
      pdf.sectionHeader("3. Course Completion Rates");
      if (completionRows.length) {
        const img = drawBarChart(completionLabels, completionRates, COLORS.success, {
          horizontal: true,
          valueSuffix: "%",
        });
        pdf.image(img, 700, 340);
        pdf.table(
          ["Course", "Enrolled", "Completed", "Completion Rate"],
          completionRows.map((d) => [
            d.courseTitle,
            String(d.enrolled),
            String(d.completed),
            `${d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0}%`,
          ]),
        );
      } else {
        pdf.caption(
          "No course completion data available for the selected period.",
        );
        pdf.noData();
      }

      // 4. Students per Package
      pdf.sectionHeader("4. Students per Package");
      if (pkgVals.length) {
        const img = drawBarChart(pkgLabels, pkgVals, COLORS.primary);
        pdf.image(img, 700, 340);
        pdf.table(
          ["Package", "Students"],
          data.studentsPerPackage!.map((d) => [
            d.packageName,
            String(d.count),
          ]),
        );
      } else {
        pdf.noData();
      }

      // 5. Enrollment Growth Over Time
      if (growthVals.length) {
        pdf.sectionHeader("5. Enrollment Growth Over Time");
        const img = drawArea(growthLabels, growthVals, COLORS.primary);
        pdf.image(img, 700, 300);
      }

      // 6. Revenue Overview
      pdf.sectionHeader("6. Revenue Overview");
      pdf.metricCards([
        { label: "Total Revenue", value: formatINR(totalRevenue) },
        { label: "ARPU", value: formatINR(derivedArpu) },
        { label: "Refund Rate", value: `${derivedRefundRate}%` },
        {
          label: "Pending",
          value: String(
            paymentStatusRows.find((p) => p.status === "PENDING")?.count ?? 0,
          ),
        },
      ]);
      pdf.paragraph(
        `Total recorded revenue is ${formatINR(totalRevenue)}, with an average revenue per learner of ${formatINR(derivedArpu)} and a refund rate of ${derivedRefundRate}%.`,
      );

      // 7. Monthly Revenue Trend
      pdf.sectionHeader("7. Monthly Revenue Trend");
      if (revenueVals.length) {
        const img = drawArea(revenueLabels, revenueVals, COLORS.success, (v) =>
          formatINR(v),
        );
        pdf.image(img, 700, 300);
      } else {
        pdf.noData();
      }

      // 8. Revenue by Package
      pdf.sectionHeader("8. Revenue by Package");
      if (revPkgVals.length) {
        const img = drawBarChart(revPkgLabels, revPkgVals, COLORS.warning);
        pdf.image(img, 700, 340);
        pdf.table(
          ["Package", "Revenue"],
          data.revenueByPackage!.map((d) => [
            d.packageName,
            formatINR(d.total),
          ]),
        );
      } else {
        pdf.noData();
      }

      // 9. Payment Status Breakdown
      pdf.sectionHeader("9. Payment Status Breakdown");
      if (paymentStatusRows.length) {
        const colors = paymentStatusLabels.map(
          (s) => PAYMENT_STATUS_COLORS[s] ?? COLORS.muted,
        );
        const img = drawDonut(paymentStatusLabels, paymentStatusCounts, colors);
        pdf.image(img, 700, 300);
        pdf.table(
          ["Status", "Count", "Amount"],
          paymentStatusRows.map((d) => [
            d.status,
            String(d.count),
            formatINR(d.amount),
          ]),
        );
      } else {
        pdf.caption("No payment status data available for the selected period.");
        pdf.noData();
      }

      // 10. Recent Transactions
      pdf.sectionHeader("10. Recent Transactions");
      if (data.recentEnrollments?.length) {
        pdf.table(
          ["Student", "Email", "Package", "Status", "Date"],
          data.recentEnrollments.map((e) => [
            e.userName,
            e.userEmail,
            e.packageName,
            e.status,
            new Date(e.appliedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          ]),
          {
            0: { cellWidth: 30 },
            1: { cellWidth: 45 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
          },
        );
      } else {
        pdf.noData();
      }

      pdf.finalize({
        coverEyebrow: "LEARNING MANAGEMENT SYSTEM",
        coverTitle: "Platform Report",
        periodLabel,
        generatedDate,
        footerLabel: "LMS Portal — Platform Report",
      });
      pdf.save(
        `LMS-Report-${timeRange}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (err) {
      console.error("Report PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

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
          <button
            onClick={handleDownloadPDF}
            disabled={downloading || !data}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <IconDownload size={16} />
            )}
            {downloading ? "Generating..." : "Download Report PDF"}
          </button>
        }
      />

      {/* Time Range Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <IconCalendar size={16} className="text-muted-foreground" />
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.value}
            onClick={() => setTimeRange(tr.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              timeRange === tr.value
                ? "bg-primary/10 text-primary border-primary/20"
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            {tr.label}
          </button>
        ))}
        <button
          onClick={refetch}
          className="ml-2 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover transition-colors cursor-pointer"
          title="Refresh"
        >
          <IconRefresh size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          Loading...
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((m) => {
          const delta =
            m.prev !== null && m.prev !== undefined
              ? pctChange(m.value, m.prev)
              : null;
          return (
            <div
              key={m.label}
              className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40"
            >
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {m.isCurrency
                  ? formatINR(m.value)
                  : `${m.value.toLocaleString("en-IN")}${m.suffix ?? ""}`}
              </p>
              {delta && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    delta.direction === "up"
                      ? "text-success"
                      : delta.direction === "down"
                        ? "text-danger"
                        : "text-muted-foreground"
                  }`}
                >
                  {delta.direction === "up"
                    ? "▲"
                    : delta.direction === "down"
                      ? "▼"
                      : "—"}{" "}
                  {delta.text} vs last period
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Enrollment ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Enrollment
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Students per Package
            </h3>
            {pkgVals.length ? (
              <Chart
                key={`pkg-${timeRange}-${pkgVals.join(",")}`}
                options={{
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.primary],
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                  xaxis: {
                    categories: pkgLabels,
                    labels: { style: { colors: COLORS.muted, fontSize: "11px" }, rotate: -20 },
                  },
                  yaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light" },
                  dataLabels: { enabled: false },
                }}
                series={[{ name: "Students", data: pkgVals }]}
                type="bar"
                height={320}
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No data
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Enrollment Growth Over Time
            </h3>
            {growthVals.length ? (
              <Chart
                key={`growth-${timeRange}-${growthVals.join(",")}`}
                options={{
                  chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.primary],
                  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0 } },
                  xaxis: {
                    categories: growthLabels,
                    labels: { style: { colors: COLORS.muted, fontSize: "11px" } },
                  },
                  yaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light" },
                  dataLabels: { enabled: false },
                  stroke: { width: 2 },
                }}
                series={[{ name: "Enrolled", data: growthVals }]}
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
      </div>

      {/* ── Course performance ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Course Performance
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Students per Course
            </h3>
            {courseVals.length ? (
              <Chart
                key={`course-${timeRange}-${courseVals.join(",")}`}
                options={{
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.accent],
                  plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                  xaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  yaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light" },
                  dataLabels: { enabled: false },
                }}
                series={[
                  {
                    name: "Students",
                    data: courseLabels.map((l, i) => ({ x: l, y: courseVals[i] })),
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

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Course Completion Rates
            </h3>
            {completionRows.length ? (
              <Chart
                key={`completion-${timeRange}-${completionRates.join(",")}`}
                options={{
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.success],
                  plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                  xaxis: {
                    max: 100,
                    labels: {
                      style: { colors: COLORS.muted, fontSize: "11px" },
                      formatter: (v: string) => `${v}%`,
                    },
                  },
                  yaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light", y: { formatter: (v: number) => `${v}%` } },
                  dataLabels: { enabled: false },
                }}
                series={[
                  {
                    name: "Completion",
                    data: completionLabels.map((l, i) => ({
                      x: l,
                      y: completionRates[i],
                    })),
                  },
                ]}
                type="bar"
                height={300}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
                No completion data for this period yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Payments & revenue ── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Payments &amp; Revenue
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Monthly Revenue Trend
            </h3>
            {revenueVals.length ? (
              <Chart
                key={`revenue-${timeRange}-${revenueVals.join(",")}`}
                options={{
                  chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.success],
                  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0 } },
                  xaxis: { categories: revenueLabels, labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                  yaxis: {
                    labels: {
                      style: { colors: COLORS.muted, fontSize: "11px" },
                      formatter: (v: number) => formatINR(v),
                    },
                  },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light", y: { formatter: (v: number) => formatINR(v) } },
                  dataLabels: { enabled: false },
                  stroke: { width: 2 },
                }}
                series={[{ name: "Revenue", data: revenueVals }]}
                type="area"
                height={300}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No payment data
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Payment Status Breakdown
            </h3>
            {paymentStatusRows.length ? (
              <Chart
                key={`paystatus-${timeRange}-${paymentStatusCounts.join(",")}`}
                options={{
                  chart: { type: "donut", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: paymentStatusLabels.map(
                    (s) => PAYMENT_STATUS_COLORS[s] ?? COLORS.muted,
                  ),
                  labels: paymentStatusLabels,
                  plotOptions: { pie: { donut: { size: "65%" } } },
                  legend: { position: "bottom", fontSize: "12px", labels: { colors: "var(--muted-foreground)" } },
                  tooltip: { theme: "light" },
                  dataLabels: { enabled: false },
                }}
                series={paymentStatusCounts}
                type="donut"
                height={300}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No payment data
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Revenue by Package
            </h3>
            {revPkgVals.length ? (
              <Chart
                key={`revpkg-${timeRange}-${revPkgVals.join(",")}`}
                options={{
                  chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                  colors: [COLORS.warning],
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                  xaxis: {
                    categories: revPkgLabels,
                    labels: { style: { colors: COLORS.muted, fontSize: "11px" }, rotate: -20 },
                  },
                  yaxis: {
                    labels: {
                      style: { colors: COLORS.muted, fontSize: "11px" },
                      formatter: (v: number) => formatINR(v),
                    },
                  },
                  grid: { borderColor: COLORS.grid },
                  tooltip: { theme: "light", y: { formatter: (v: number) => formatINR(v) } },
                  dataLabels: { enabled: false },
                }}
                series={[{ name: "Revenue", data: revPkgVals }]}
                type="bar"
                height={300}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No payment data
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Average Revenue Per User
              </p>
              <p className="mt-1 text-3xl font-semibold text-foreground">
                {formatINR(derivedArpu)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Refund Rate
              </p>
              <p className="mt-1 text-3xl font-semibold text-foreground">
                {derivedRefundRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      {data?.recentEnrollments && data.recentEnrollments.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Recent Transactions
          </h3>
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentEnrollments.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5">
                      <p className="font-medium text-foreground">{e.userName}</p>
                      <p className="text-xs text-muted">{e.userEmail}</p>
                    </td>
                    <td className="py-2.5 text-foreground">{e.packageName}</td>
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
    </div>
  );
}
