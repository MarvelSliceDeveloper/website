"use client";

import { useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TIME_RANGES, useReportData } from "@/lib/report-utils";
import ReportExportDropdown from "../_components/ReportExportDropdown";
import TimeRangeFilter from "../_components/TimeRangeFilter";
import CoursePerformanceSection from "../_components/CoursePerformanceSection";
import EnrollmentSection from "../_components/EnrollmentSection";

export default function CourseReportPage() {
  usePageTitle("Course Report");
  const [timeRange, setTimeRange] = useState("all");
  const { data, loading, refetch } = useReportData(timeRange);

  const periodLabel =
    timeRange === "all"
      ? "All Time"
      : (TIME_RANGES.find((t) => t.value === timeRange)?.label ?? timeRange);
  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
        title="Course Report"
        description="Students per course, completion rates, and enrollment breakdown."
        breadcrumbs={[
          { label: "Reports", href: "/admin/reports" },
          { label: "Course Report", href: "/admin/reports/course" },
        ]}
        role="Analytics"
        action={
          <ReportExportDropdown
            data={data}
            scope="course"
            timeRange={timeRange}
            periodLabel={periodLabel}
            generatedDate={generatedDate}
            pdfLabel="Download Course PDF"
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

      <CoursePerformanceSection data={data} timeRange={timeRange} />

      <EnrollmentSection data={data} timeRange={timeRange} />
    </div>
  );
}
