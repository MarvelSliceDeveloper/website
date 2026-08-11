"use client";

import { useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TIME_RANGES, useReportData } from "@/lib/report-utils";
import ReportExportDropdown from "../_components/ReportExportDropdown";
import TimeRangeFilter from "../_components/TimeRangeFilter";
import PaymentsSection from "../_components/PaymentsSection";
import RecentTransactions from "../_components/RecentTransactions";

export default function PaymentReportPage() {
  usePageTitle("Payment Report");
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
        title="Payment Report"
        description="Revenue trends, payment statuses, and recent transactions."
        breadcrumbs={[
          { label: "Reports", href: "/admin/reports" },
          { label: "Payment Report", href: "/admin/reports/payment" },
        ]}
        role="Analytics"
        action={
          <ReportExportDropdown
            data={data}
            scope="payment"
            timeRange={timeRange}
            periodLabel={periodLabel}
            generatedDate={generatedDate}
            pdfLabel="Download Payment PDF"
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

      <PaymentsSection data={data} timeRange={timeRange} />

      <RecentTransactions data={data} />
    </div>
  );
}
