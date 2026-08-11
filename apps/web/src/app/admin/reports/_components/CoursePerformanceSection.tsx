"use client";

import dynamic from "next/dynamic";
import { COLORS } from "@/lib/report-utils";
import type { DashboardChartData } from "@/lib/api-types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CoursePerformanceSection({
  data,
  timeRange,
}: {
  data: DashboardChartData | null;
  timeRange: string;
}) {
  const courseLabels = (data?.studentsPerCourse ?? []).map((d) => d.courseTitle);
  const courseVals = (data?.studentsPerCourse ?? []).map((d) => d.count);

  const completionRows = data?.courseCompletion ?? [];
  const completionLabels = completionRows.map((d) => d.courseTitle);
  const completionRates = completionRows.map((d) =>
    d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0,
  );

  const topCourses = data?.topCourses ?? [];
  const topLabels = topCourses.map((d) => d.courseTitle);
  const topVals = topCourses.map((d) => d.enrollmentCount);

  const enrolledVals = completionRows.map((d) => d.enrolled);
  const completedVals = completionRows.map((d) => d.completed);

  const donutColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.danger];

  return (
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

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Top Courses by Enrollment
          </h3>
          {topVals.length ? (
            <Chart
              key={`topcourses-${timeRange}-${topVals.join(",")}`}
              options={{
                chart: { type: "donut", toolbar: { show: false }, fontFamily: "inherit" },
                colors: donutColors,
                labels: topLabels,
                plotOptions: { pie: { donut: { size: "65%" } } },
                legend: { position: "bottom", fontSize: "12px", labels: { colors: "var(--muted-foreground)" } },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
              }}
              series={topVals}
              type="donut"
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
            Enrolled vs Completed
          </h3>
          {completionRows.length ? (
            <Chart
              key={`enrvscomp-${timeRange}-${enrolledVals.join(",")}-${completedVals.join(",")}`}
              options={{
                chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
                colors: [COLORS.primary, COLORS.success],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
                xaxis: {
                  categories: completionLabels,
                  labels: { style: { colors: COLORS.muted, fontSize: "11px" }, rotate: -20 },
                },
                yaxis: { labels: { style: { colors: COLORS.muted, fontSize: "11px" } } },
                grid: { borderColor: COLORS.grid },
                tooltip: { theme: "light" },
                dataLabels: { enabled: false },
                legend: { position: "bottom", fontSize: "12px", labels: { colors: "var(--muted-foreground)" } },
              }}
              series={[
                { name: "Enrolled", data: enrolledVals },
                { name: "Completed", data: completedVals },
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
    </div>
  );
}
