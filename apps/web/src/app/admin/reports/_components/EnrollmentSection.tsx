"use client";

import dynamic from "next/dynamic";
import { COLORS } from "@/lib/report-utils";
import type { DashboardChartData } from "@/lib/api-types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function EnrollmentSection({
  data,
  timeRange,
}: {
  data: DashboardChartData | null;
  timeRange: string;
}) {
  const pkgLabels = (data?.studentsPerPackage ?? []).map((d) => d.packageName);
  const pkgVals = (data?.studentsPerPackage ?? []).map((d) => d.count);
  const growthLabels = (data?.enrollmentTrend ?? []).map((d) => d.month);
  const growthVals = (data?.enrollmentTrend ?? []).map((d) => d.count);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Enrollment</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Students per Package
          </h3>
          {pkgVals.length ? (
            <Chart
              key={`pkg-${timeRange}-${pkgVals.join(",")}`}
              options={{
                chart: {
                  type: "bar",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                },
                colors: [COLORS.primary],
                plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                xaxis: {
                  categories: pkgLabels,
                  labels: {
                    style: { colors: COLORS.muted, fontSize: "11px" },
                    rotate: -20,
                  },
                },
                yaxis: {
                  labels: { style: { colors: COLORS.muted, fontSize: "11px" } },
                },
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
                  categories: growthLabels,
                  labels: { style: { colors: COLORS.muted, fontSize: "11px" } },
                },
                yaxis: {
                  labels: { style: { colors: COLORS.muted, fontSize: "11px" } },
                },
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
  );
}
