"use client";

import dynamic from "next/dynamic";
import {
  COLORS,
  PAYMENT_STATUS_COLORS,
  formatINR,
} from "@/lib/report-utils";
import type { DashboardChartData } from "@/lib/api-types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function PaymentsSection({
  data,
  timeRange,
}: {
  data: DashboardChartData | null;
  timeRange: string;
}) {
  const revenueLabels = (data?.monthlyRevenue ?? []).map((d) => d.month);
  const revenueVals = (data?.monthlyRevenue ?? []).map((d) => d.amount);
  const revPkgLabels = (data?.revenueByPackage ?? []).map((d) => d.packageName);
  const revPkgVals = (data?.revenueByPackage ?? []).map((d) => d.total);
  const paymentStatusRows = data?.paymentStatusDistribution ?? [];
  const paymentStatusLabels = paymentStatusRows.map((d) => d.status);
  const paymentStatusCounts = paymentStatusRows.map((d) => d.count);

  const totalStudents =
    (data?.userRoleDistribution ?? []).find((u) => u.role === "STUDENT")?.count ??
    0;
  const totalRevenue = revenueVals.reduce((a, b) => a + b, 0);
  const derivedArpu =
    data?.arpu ?? (totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0);
  const refundRow = paymentStatusRows.find((p) => p.status === "REFUNDED");
  const derivedRefundRate = data?.refundRate ?? (refundRow ? refundRow.count : 0);

  return (
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
  );
}
