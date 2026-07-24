"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconEye,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PackageEnrollment = {
  id: string;
  userId: string;
  packageId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string; email: string };
  package: {
    id: string;
    name: string;
    _count: { courses: number };
  };
  courses: {
    courseId: string;
    batchId: string | null;
    course: { id: string; title: string };
    batch: { id: string; name: string } | null;
  }[];
};

type Batch = {
  id: string;
  name: string;
  courseId: string;
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

export default function PackageEnrollmentsPage() {
  usePageTitle("Package Enrollments");
  const [enrollments, setEnrollments] = useState<PackageEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<PackageEnrollment | null>(
    null,
  );
  const [batchesMap, setBatchesMap] = useState<Record<string, Batch[]>>({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchAssignments, setBatchAssignments] = useState<
    Record<string, string>
  >({});
  const [processing, setProcessing] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: PackageEnrollment[] }>(
        `/api/admin/package-enrollments?status=${statusFilter}`,
      );
      setEnrollments(data.items || []);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  // Fetch batches for approve modal
  useEffect(() => {
    if (!approveModal) return;
    setLoadingBatches(true);
    setBatchAssignments({});

    const fetchAllBatches = async () => {
      const map: Record<string, Batch[]> = {};
      // Get unique course IDs from the enrollment's package courses
      const courseIds = [
        ...new Set(approveModal.courses.map((c) => c.courseId)),
      ];
      for (const courseId of courseIds) {
        try {
          const data = await api.get<{ batches: Batch[] }>(
            `/api/admin/batches?courseId=${courseId}`,
          );
          map[courseId] = data.batches || [];
        } catch {
          map[courseId] = [];
        }
      }
      setBatchesMap(map);
      setLoadingBatches(false);
    };
    fetchAllBatches();
  }, [approveModal]);

  const handleApprove = async () => {
    if (!approveModal) return;
    const assignments = Object.entries(batchAssignments)
      .filter(([_, batchId]) => batchId)
      .map(([courseId, batchId]) => ({ courseId, batchId }));

    const totalCourses = approveModal.courses.length;
    if (assignments.length !== totalCourses) {
      toast.error("Assign a batch for every course");
      return;
    }

    setProcessing(true);
    try {
      await api.patch(
        `/api/admin/package-enrollments/${approveModal.id}/approve`,
        { courseBatchAssignments: assignments },
      );
      toast.success("Enrollment approved and batches assigned");
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
      await api.patch(`/api/admin/package-enrollments/${id}/reject`);
      toast.success("Enrollment rejected");
      fetchEnrollments();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Package Enrollments"
        description="Review and approve student enrollments into course packages."
        breadcrumbs={[
          { label: "Packages", href: "/admin/packages" },
          { label: "Enrollments", href: "/admin/packages/enrollments" },
        ]}
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
            description="All package enrollment requests have been reviewed."
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
                    Package:{" "}
                    <span className="text-foreground font-medium">
                      {enrollment.package.name}
                    </span>
                    {" · "}
                    {enrollment.package._count.courses} course
                    {enrollment.package._count.courses !== 1 ? "s" : ""}
                    {" · "}Applied:{" "}
                    {new Date(enrollment.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                  {enrollment.courses.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {enrollment.courses.map((ec) => (
                        <span
                          key={ec.courseId}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {ec.course.title}
                          {ec.batch && ` → ${ec.batch.name}`}
                        </span>
                      ))}
                    </div>
                  )}
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

                <Link
                  href={`/admin/packages/${enrollment.packageId}`}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <IconEye size={14} stroke={1.5} />
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal — assign batches per course */}
      {approveModal && (
        <FormModal
          open={true}
          onClose={() => setApproveModal(null)}
          title="Approve & Assign Batches"
          size="lg"
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
              <span className="text-muted">Package:</span>{" "}
              <span className="font-medium text-foreground">
                {approveModal.package.name}
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Assign a batch for each course:
            </p>
            {loadingBatches ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border"
                  />
                ))}
              </div>
            ) : (
              approveModal.courses.map((ec) => (
                <div key={ec.courseId}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {ec.course.title}
                  </label>
                  <Select
                    value={batchAssignments[ec.courseId] || ""}
                    onValueChange={(val) =>
                      setBatchAssignments((prev) => ({
                        ...prev,
                        [ec.courseId]: val,
                      }))
                    }
                  >
                    <SelectTrigger className="field w-full">
                      <SelectValue placeholder="-- Select Batch --" />
                    </SelectTrigger>
                    <SelectContent>
                      {(batchesMap[ec.courseId] || []).length === 0 ? (
                        <SelectItem value="none" disabled>
                          No batches for this course
                        </SelectItem>
                      ) : (
                        (batchesMap[ec.courseId] || []).map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} — {batch._count?.enrollments || 0}
                            {batch.maxStudents
                              ? `/${batch.maxStudents}`
                              : ""}{" "}
                            students
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
}
