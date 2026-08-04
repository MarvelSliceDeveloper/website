"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconRefresh,
  IconCheck,
  IconX,
  IconArrowBackUp,
} from "@tabler/icons-react";

type Payment = {
  id: string;
  razorpayPaymentId: string | null;
  studentName: string;
  studentEmail: string;
  packageName: string;
  amount: number;
  currency: string;
  status: "CREATED" | "CAPTURED" | "FAILED" | "REFUNDED";
  createdAt: string;
};

type RevenueStats = {
  totalRevenue: number;
  totalPayments: number;
  successful: number;
  failed: number;
  refunded: number;
};

const statusConfig: Record<
  string,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  CAPTURED: {
    label: "Successful",
    classes: "bg-success/15 text-success border-success/25",
    icon: <IconCheck size={10} />,
  },
  FAILED: {
    label: "Failed",
    classes: "bg-danger/15 text-danger border-danger/25",
    icon: <IconX size={10} />,
  },
  REFUNDED: {
    label: "Refunded",
    classes: "bg-warning/15 text-warning border-warning/25",
    icon: <IconArrowBackUp size={10} />,
  },
  CREATED: {
    label: "Pending",
    classes: "bg-muted/15 text-muted-foreground border-muted/25",
    icon: null,
  },
};

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function AdminPaymentsPage() {
  usePageTitle("Payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [paymentsData, statsData] = await Promise.all([
        api.get<{ items: Payment[] }>("/api/admin/payments"),
        api.get<RevenueStats>("/api/admin/payments/revenue"),
      ]);
      setPayments(paymentsData.items ?? []);
      setStats(statsData);
    } catch {
      setPayments([]);
      setStats({
        totalRevenue: 0,
        totalPayments: 0,
        successful: 0,
        failed: 0,
        refunded: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Payments"
        description="Revenue dashboard and payment history."
        breadcrumbs={[{ label: "Payments", href: "/admin/payments" }]}
        role="Administration"
        action={
          <button
            onClick={fetchData}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats
          ? [
              {
                label: "Total Revenue",
                value: formatCurrency(stats.totalRevenue),
                color: "text-primary",
              },
              {
                label: "Total Payments",
                value: stats.totalPayments.toLocaleString(),
                color: "text-foreground",
              },
              {
                label: "Successful",
                value: stats.successful.toLocaleString(),
                color: "text-success",
              },
              {
                label: "Failed",
                value: stats.failed.toLocaleString(),
                color: "text-danger",
              },
              {
                label: "Refunded",
                value: stats.refunded.toLocaleString(),
                color: "text-warning",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
      </div>

      {/* Recent Payments Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Recent Payments
        </h3>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 pr-3">Student</th>
                  <th className="py-2.5 pr-3">Package</th>
                  <th className="py-2.5 pr-3 text-right">Amount</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {payments.map((payment) => {
                  const cfg = statusConfig[payment.status];
                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="py-3 pr-3 text-muted whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-medium text-foreground">
                          {payment.studentName}
                        </span>
                        <br />
                        <span className="text-[10px] text-muted-foreground">
                          {payment.studentEmail}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {payment.packageName}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium text-foreground whitespace-nowrap">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg?.classes}`}
                        >
                          {cfg?.icon}
                          {cfg?.label || payment.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[10px] text-muted-foreground">
                        {payment.razorpayPaymentId || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
