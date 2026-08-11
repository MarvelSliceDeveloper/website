"use client";

import type { DashboardChartData } from "@/lib/api-types";

export default function RecentTransactions({
  data,
}: {
  data: DashboardChartData | null;
}) {
  const enrollments = data?.recentEnrollments ?? [];

  if (enrollments.length === 0) return null;

  return (
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
            {enrollments.map((e) => (
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
  );
}
