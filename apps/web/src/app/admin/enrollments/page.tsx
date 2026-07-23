"use client";

import { useEffect, useState, type ComponentType } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePageTitle } from "@/lib/use-page-title";
import { IconClock, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Enrollment = {
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
  courseId: string | null;
  _count: { enrollments: number };
  maxStudents: number | null;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning border-warning/25",
  APPROVED: "bg-success/15 text-success border-success/25",
  REJECTED: "bg-danger/15 text-danger border-danger/25",
};

const statusIcons: Record<
  string,
  ComponentType<{ size?: number | string; stroke?: number | string }>
> = {
  PENDING: IconClock,
  APPROVED: IconCircleCheck,
  REJECTED: IconCircleX,
};

export default function AdminEnrollmentsPage() {
  usePageTitle("Enrollments");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<Enrollment | null>(null);
  const [courseBatches, setCourseBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ enrollments: Enrollment[] }>(
        `/api/admin/enrollments?status=${statusFilter}`,
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

  // Fetch batches when approve modal opens
  useEffect(() => {
    if (!approveModal) return;
    setLoadingBatches(true);
    setSelectedBatchId("");

    (async () => {
      try {
        const data = await api.get<Batch[]>(
          `/api/admin/batches?courseId=${approveModal.courseId}`,
        );
        setCourseBatches(Array.isArray(data) ? data : []);
      } catch {
        setCourseBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    })();
  }, [approveModal]);

  const handleApprove = async () => {
    if (!approveModal) return;
    if (!selectedBatchId) {
      toast.error("Select a batch to assign");
      return;
    }

    setProcessing(true);
    try {
      await api.patch(`/api/admin/enrollments/${approveModal.id}/approve`, {
        batchId: selectedBatchId,
      });
      toast.success("Enrollment approved and batch assigned");
      setApproveModal(null);
      fetchEnrollments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this enrollment?")) return;
    try {
      await api.patch(`/api/admin/enrollments/${id}/reject`);
      toast.success("Enrollment rejected");
      fetchEnrollments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Course Enrollments"
        description="Review and approve individual course enrollment requests."
        breadcrumbs={[{ label: "Enrollments", href: "/admin/enrollments" }]}
      />

      {/* Status filters */}
      <div className="flex gap-1.5">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const Icon = statusIcons[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? statusStyles[s]
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              <Icon size={16} stroke={1.5} />
              {s}
            </button>
          );
        })}
      </div>

      {/* Enrollment Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : enrollments.length === 0 ? (
        statusFilter === "PENDING" ? (
          <EmptyState
            variant="glass"
            icon={IconClock}
            title="No pending enrollments"
            description="All enrollment requests have been reviewed."
          />
        ) : statusFilter === "APPROVED" ? (
          <EmptyState
            variant="glass"
            icon={IconCircleCheck}
            title="No approved enrollments"
            description="Check the other filters to find what you're looking for."
          />
        ) : (
          <EmptyState
            variant="glass"
            icon={IconCircleX}
            title="No rejected enrollments"
            description="Check the other filters to find what you're looking for."
          />
        )
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="glass-card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {enrollment.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {enrollment.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {enrollment.user.email}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Course:{" "}
                    <span className="text-foreground font-medium">
                      {enrollment.courseTitle}
                    </span>
                    {" · "}Applied:{" "}
                    {new Date(enrollment.appliedAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                    {enrollment.batchName && (
                      <>
                        {" · "}Batch:{" "}
                        <span className="text-foreground">
                          {enrollment.batchName}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[enrollment.status]}`}
                >
                  {(() => {
                    const StatusIcon = statusIcons[enrollment.status];
                    return <StatusIcon size={14} stroke={1.5} />;
                  })()}{" "}
                  {enrollment.status}
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
                      className="btn-danger text-xs"
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

      {/* Approve Modal — assign batch */}
      {approveModal && (
        <FormModal
          open={true}
          onClose={() => setApproveModal(null)}
          title="Approve & Assign Batch"
          size="md"
          footer={
            <>
              <button
                onClick={() => setApproveModal(null)}
                className="btn-secondary text-sm"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
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
            </>
          }
        >
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted">Student:</span>{" "}
              <span className="font-medium text-foreground">
                {approveModal.user.name}
              </span>
            </p>
            <p>
              <span className="text-muted">Course:</span>{" "}
              <span className="font-medium text-foreground">
                {approveModal.courseTitle}
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Assign a batch:
            </label>
            {loadingBatches ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : (
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
                <SelectTrigger className="field w-full">
                  <SelectValue placeholder="-- Select Batch --" />
                </SelectTrigger>
                <SelectContent>
                  {courseBatches.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No batches for this course
                    </SelectItem>
                  ) : (
                    courseBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} — {batch._count?.enrollments || 0}
                        {batch.maxStudents ? `/${batch.maxStudents}` : ""}{" "}
                        students
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
}
