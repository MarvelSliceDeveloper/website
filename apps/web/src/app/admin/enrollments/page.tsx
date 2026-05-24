"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type EnrollmentRequest = {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  batchId: string | null;
  batchName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
};

type Batch = {
  id: string;
  name: string;
  courseId: string;
  course: { id: string; title: string };
  instructor: { id: string; name: string };
  _count: { enrollments: number };
  maxStudents: number | null;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning border-warning/25",
  APPROVED: "bg-success/15 text-success border-success/25",
  REJECTED: "bg-danger/15 text-danger border-danger/25",
};

const statusIcons: Record<string, string> = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<EnrollmentRequest | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ enrollments: EnrollmentRequest[] }>(
        `/api/admin/enrollments?status=${statusFilter}`
      );
      setEnrollments(data.enrollments || []);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  // When approve modal opens, fetch batches for that course
  useEffect(() => {
    if (!approveModal) return;
    setLoadingBatches(true);
    setSelectedBatchId("");
    api
      .get<Batch[]>(`/api/admin/batches?courseId=${approveModal.courseId}`)
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [approveModal]);

  const handleApprove = async () => {
    if (!approveModal || !selectedBatchId) return;
    setProcessing(true);
    try {
      await api.patch(`/api/admin/enrollments/${approveModal.id}/approve`, {
        batchId: selectedBatchId,
      });
      setApproveModal(null);
      fetchEnrollments();
    } catch (err: any) {
      alert(err.message || "Failed to approve enrollment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this enrollment request?")) return;
    try {
      await api.patch(`/api/admin/enrollments/${id}/reject`);
      fetchEnrollments();
    } catch (err: any) {
      alert(err.message || "Failed to reject enrollment");
    }
  };

  const counts = {
    pending: enrollments.filter(() => statusFilter === "PENDING").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
          Enrollment Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, approve, and assign students to course batches.
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === s
                ? statusStyles[s]
                : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            <span>{statusIcons[s]}</span>
            {s}
          </button>
        ))}
      </div>

      {/* Enrollment Cards */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading enrollment requests...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">
            {statusFilter === "PENDING" ? "🎉" : "📋"}
          </div>
          <p className="text-lg font-semibold text-foreground">
            {statusFilter === "PENDING"
              ? "No pending requests"
              : `No ${statusFilter.toLowerCase()} enrollments`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === "PENDING"
              ? "All enrollment requests have been reviewed."
              : "Check the other filters to find what you're looking for."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="glass-card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-accent/20 text-sm font-bold text-foreground">
                  {enrollment.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{enrollment.user.name}</p>
                  <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Course: <span className="text-foreground font-medium">{enrollment.courseTitle}</span>
                    {" · "}Applied:{" "}
                    {new Date(enrollment.appliedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {enrollment.batchName && (
                    <p className="text-xs text-success mt-0.5">
                      Assigned to: {enrollment.batchName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[enrollment.status]}`}
                >
                  {statusIcons[enrollment.status]} {enrollment.status}
                </span>

                {enrollment.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => setApproveModal(enrollment)}
                      className="btn-primary text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(enrollment.id)}
                      className="btn-secondary text-xs border-danger/30 text-danger hover:bg-danger/10"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal — assign to batch */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">
                Approve & Assign to Batch
              </h3>
              <button
                onClick={() => setApproveModal(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted">Student:</span>{" "}
                <span className="font-medium text-foreground">{approveModal.user.name}</span>
              </p>
              <p>
                <span className="text-muted">Course:</span>{" "}
                <span className="font-medium text-foreground">{approveModal.courseTitle}</span>
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Assign to Batch <span className="text-danger">*</span>
              </label>
              {loadingBatches ? (
                <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
              ) : batches.length === 0 ? (
                <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-xs text-warning">
                  No batches found for this course. Create a batch first before approving.
                </div>
              ) : (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="field w-full"
                >
                  <option value="">-- Select Batch --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} — {batch._count?.enrollments || 0}
                      {batch.maxStudents ? `/${batch.maxStudents}` : ""} students
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
              <button
                onClick={() => setApproveModal(null)}
                className="btn-secondary text-sm"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing || !selectedBatchId}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Approving...
                  </>
                ) : (
                  "Approve & Assign"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
