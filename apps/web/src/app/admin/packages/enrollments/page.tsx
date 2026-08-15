"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePageTitle } from "@/lib/use-page-title";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
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

function CourseBatchSelect({
  courseId,
  courseTitle,
  value,
  onChange,
}: {
  courseId: string;
  courseTitle: string;
  value: string;
  onChange: (batchId: string) => void;
}) {
  const batchesQuery = useApiQuery<{ batches: Batch[] }>(
    ["admin", "batches", "course", courseId],
    "/api/admin/batches",
    { courseId },
    { enabled: Boolean(courseId) },
  );
  const batches = batchesQuery.data?.batches ?? [];
  const loadingBatches = batchesQuery.isPending;

  if (loadingBatches) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {courseTitle}
        </label>
        <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {courseTitle}
      </label>
      <Select
        value={value || ""}
        onValueChange={(val) => onChange(val || "")}
      >
        <SelectTrigger className="field w-full">
          <SelectValue placeholder="-- Select Batch --" />
        </SelectTrigger>
        <SelectContent>
          {batches.length === 0 ? (
            <SelectItem value="none" disabled>
              No batches for this course
            </SelectItem>
          ) : (
            batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name} — {batch._count?.enrollments || 0}
                {batch.maxStudents ? `/${batch.maxStudents}` : ""} students
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function PackageEnrollmentsPage() {
  usePageTitle("Package Enrollments");
  const confirmDelete = useConfirmDialog();
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<PackageEnrollment | null>(
    null,
  );
  const [batchAssignments, setBatchAssignments] = useState<
    Record<string, string>
  >({});

  const enrollmentsQuery = useApiQuery<{ items: PackageEnrollment[] }>(
    ["admin", "package-enrollments", statusFilter],
    `/api/admin/package-enrollments?status=${statusFilter}`,
  );
  const enrollments = enrollmentsQuery.data?.items ?? [];
  const loading = enrollmentsQuery.isPending;

  useEffect(() => {
    if (approveModal) setBatchAssignments({});
  }, [approveModal]);

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      assignments,
    }: {
      id: string;
      assignments: { courseId: string; batchId: string }[];
    }) =>
      api.patch(`/api/admin/package-enrollments/${id}/approve`, {
        courseBatchAssignments: assignments,
      }),
    onSuccess: () => {
      toast.success("Enrollment approved and batches assigned");
      setApproveModal(null);
      void enrollmentsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleApprove = () => {
    if (!approveModal) return;
    const assignments = Object.entries(batchAssignments)
      .filter(([_, batchId]) => batchId)
      .map(([courseId, batchId]) => ({ courseId, batchId }));

    const totalCourses = approveModal.courses.length;
    if (assignments.length !== totalCourses) {
      toast.error("Assign a batch for every course");
      return;
    }

    approveMutation.mutate({ id: approveModal.id, assignments });
  };

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/admin/package-enrollments/${id}/reject`),
    onSuccess: () => {
      toast.success("Enrollment rejected");
      void enrollmentsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleReject = async (id: string) => {
    if (
      !(await confirmDelete({
        title: "Reject Enrollment",
        message: "Are you sure you want to reject this enrollment?",
      }))
    )
      return;
    rejectMutation.mutate(id);
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
                disabled={approveMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {approveMutation.isPending ? (
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
            <div className="space-y-3">
              {approveModal.courses.map((ec) => (
                <CourseBatchSelect
                  key={ec.courseId}
                  courseId={ec.courseId}
                  courseTitle={ec.course.title}
                  value={batchAssignments[ec.courseId] || ""}
                  onChange={(val) =>
                    setBatchAssignments((prev) => ({
                      ...prev,
                      [ec.courseId]: val,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
