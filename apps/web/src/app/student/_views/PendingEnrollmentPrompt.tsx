"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

interface IncompletePurchase {
  paymentId: string;
  packageId: string | null;
  packageName: string;
  amount: number;
  paidAt: string;
}

interface BatchOption {
  id: string;
  name: string;
  course?: { id: string; title: string };
  startDate?: string;
  seatsAvailable?: number | null;
}

function IncompletePurchaseRow({
  item,
  studentName,
  studentEmail,
  onDone,
}: {
  item: IncompletePurchase;
  studentName: string;
  studentEmail: string;
  onDone: () => void;
}) {
  const [batchId, setBatchId] = useState("");
  const batchesQuery = useApiQuery<BatchOption[]>(
    ["student", "incomplete-batches", item.packageId ?? item.paymentId],
    "/api/payments/batches",
    item.packageId ? { packageId: item.packageId } : undefined,
  );
  const batches = batchesQuery.data ?? [];

  const enrollMutation = useMutation({
    mutationFn: () =>
      api.post<{ isNewUser: boolean; email: string }>("/api/payments/enroll", {
        paymentId: item.paymentId,
        batchId,
        name: studentName,
        email: studentEmail,
      }),
    onSuccess: (result) => {
      toast.success(
        result.isNewUser
          ? "Enrollment complete — account details emailed to you"
          : "Enrollment complete",
      );
      onDone();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const consentMutation = useMutation({
    mutationFn: () =>
      api.post<{ isNewUser: boolean; email: string }>("/api/payments/consent", {
        paymentId: item.paymentId,
        name: studentName,
        email: studentEmail,
      }),
    onSuccess: (result) => {
      toast.success(
        result.isNewUser
          ? "Enrollment complete — account details emailed to you"
          : "Enrollment complete",
      );
      onDone();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const busy = enrollMutation.isPending || consentMutation.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">
          {item.packageName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Paid ₹{(item.amount / 100).toLocaleString("en-IN")} on{" "}
          {new Date(item.paidAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {" — batch not selected yet"}
        </p>
      </div>
      {batchesQuery.isPending ? (
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading batches…
        </p>
      ) : batches.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor={`batch-${item.paymentId}`}>
            Select batch
          </label>
          <select
            id={`batch-${item.paymentId}`}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select a batch…</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.course?.title ? ` — ${b.course.title}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!batchId || busy}
            onClick={() => enrollMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            <IconCheck size={14} />
            {busy ? "Enrolling…" : "Enroll"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => consentMutation.mutate()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
        >
          <IconCheck size={14} />
          {busy ? "Confirming…" : "Confirm enrollment"}
        </button>
      )}
    </div>
  );
}

export default function PendingEnrollmentPrompt({
  studentName,
  studentEmail,
}: {
  studentName: string;
  studentEmail: string;
}) {
  const queryClient = useQueryClient();
  const incompleteQuery = useApiQuery<{ items: IncompletePurchase[] }>(
    ["student", "incomplete-purchases"],
    "/api/payments/incomplete",
  );
  const items = incompleteQuery.data?.items ?? [];

  if (incompleteQuery.isPending || items.length === 0) return null;

  const refreshAll = () => {
    void incompleteQuery.refetch();
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "student",
    });
  };

  return (
    <section
      aria-label="Complete your enrollment"
      className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <IconAlertCircle size={18} />
        </span>
        <div>
          <p className="text-sm font-extrabold text-foreground">
            Finish setting up your purchase
          </p>
          <p className="text-xs text-muted-foreground">
            You paid, but{" "}
            {items.length === 1
              ? "this package still needs"
              : "these packages still need"}{" "}
            a batch selection before courses unlock.
          </p>
        </div>
      </div>
      <div className="mt-3.5 space-y-2.5">
        {items.map((item) => (
          <IncompletePurchaseRow
            key={item.paymentId}
            item={item}
            studentName={studentName}
            studentEmail={studentEmail}
            onDone={refreshAll}
          />
        ))}
      </div>
    </section>
  );
}
