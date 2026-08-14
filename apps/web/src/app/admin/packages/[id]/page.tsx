"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePageTitle } from "@/lib/use-page-title";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  IconArrowLeft,
  IconUsers,
  IconBook,
  IconCheck,
  IconLink,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PackageCourse = {
  id: string;
  courseId: string;
  order: number;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    status: string;
    _count: { modules: number; batches: number };
  };
};

type PackageEnrollment = {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { id: string; name: string; email: string };
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

type PackageDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  isInternship?: boolean;
  courses: PackageCourse[];
  enrollments: PackageEnrollment[];
  _count: { enrollments: number };
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  DRAFT: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ACTIVE: {
    label: "Active",
    classes: "bg-success/15 text-success border-success/25",
  },
  ARCHIVED: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

const enrollmentStatusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  PENDING: {
    label: "Pending",
    classes: "bg-warning/15 text-warning border-warning/25",
  },
  APPROVED: {
    label: "Approved",
    classes: "bg-success/15 text-success border-success/25",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-danger/15 text-danger border-danger/25",
  },
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

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  usePageTitle("Package Details");
  const confirmDelete = useConfirmDialog();
  const { id } = use(params);
  const router = useRouter();

  const packageQuery = useApiQuery<PackageDetail>(
    ["admin", "package", "detail", id],
    `/api/admin/packages/${id}`,
  );
  const pkg = packageQuery.data ?? null;
  const loading = packageQuery.isPending;

  // Enroll modal state
  const [enrollModal, setEnrollModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Approve modal state
  const [approveModal, setApproveModal] = useState<PackageEnrollment | null>(
    null,
  );
  const [batchAssignments, setBatchAssignments] = useState<
    Record<string, string>
  >({});

  const studentsQuery = useApiQuery<{
    users: { id: string; name: string; email: string }[];
  }>(["admin", "users", "students"], "/api/users?role=STUDENT", undefined, {
    enabled: enrollModal,
  });
  const students = studentsQuery.data?.users ?? [];
  const loadingStudents = studentsQuery.isPending;

  useEffect(() => {
    if (packageQuery.isError) {
      toast.error("Failed to load package");
      router.push("/admin/packages");
    }
  }, [packageQuery.isError, router]);

  useEffect(() => {
    if (approveModal) setBatchAssignments({});
  }, [approveModal]);

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "ARCHIVED" | "DRAFT") =>
      api.patch(`/api/admin/packages/${id}/status`, { status }),
    onSuccess: (_data, status) => {
      toast.success(`Package ${status.toLowerCase()}`);
      void packageQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleStatusChange = (status: "ACTIVE" | "ARCHIVED" | "DRAFT") => {
    statusMutation.mutate(status);
  };

  const enrollMutation = useMutation({
    mutationFn: (userId: string) => {
      const courseBatchAssignments = (pkg?.courses || []).map((c) => ({
        courseId: c.courseId,
        batchId: "",
      }));
      return api.post(`/api/admin/packages/${id}/enroll`, {
        userId,
        courseBatchAssignments: courseBatchAssignments.filter(
          (a) => a.batchId,
        ),
      });
    },
    onSuccess: () => {
      toast.success("Student enrolled in package");
      setEnrollModal(false);
      setSelectedStudentId("");
      void packageQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleEnroll = () => {
    if (!selectedStudentId) return;
    enrollMutation.mutate(selectedStudentId);
  };

  const approveMutation = useMutation({
    mutationFn: ({
      id: enrollmentId,
      assignments,
    }: {
      id: string;
      assignments: { courseId: string; batchId: string }[];
    }) =>
      api.patch(
        `/api/admin/package-enrollments/${enrollmentId}/approve`,
        { courseBatchAssignments: assignments },
      ),
    onSuccess: () => {
      toast.success("Enrollment approved");
      setApproveModal(null);
      void packageQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleApprove = () => {
    if (!approveModal) return;
    const assignments = Object.entries(batchAssignments)
      .filter(([, batchId]) => batchId)
      .map(([courseId, batchId]) => ({ courseId, batchId }));

    if (assignments.length !== (pkg?.courses.length || 0)) {
      toast.error("Assign a batch for every course");
      return;
    }

    approveMutation.mutate({ id: approveModal.id, assignments });
  };

  const pkgSlug = pkg?.slug;
  const handleCopyLink = useCallback(() => {
    if (!pkgSlug) return;
    const url = `${window.location.origin}/catalogue/${pkgSlug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied!"),
      () => toast.error("Failed to copy link"),
    );
  }, [pkgSlug]);

  const rejectMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.patch(`/api/admin/package-enrollments/${enrollmentId}/reject`),
    onSuccess: () => {
      toast.success("Enrollment rejected");
      void packageQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleReject = async (enrollmentId: string) => {
    if (
      !(await confirmDelete({
        title: "Reject Enrollment",
        message: "Reject this enrollment?",
      }))
    )
      return;
    rejectMutation.mutate(enrollmentId);
  };

  const openEnrollModal = () => {
    setEnrollModal(true);
    setSelectedStudentId("");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className="space-y-6 motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title={pkg.name}
        description={pkg.description || undefined}
        breadcrumbs={[
          { label: "Packages", href: "/admin/packages" },
          { label: pkg.name, href: `/admin/packages/${id}` },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/packages"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <IconArrowLeft size={16} stroke={1.5} />
              Back
            </Link>
            {pkg.slug && (
              <button
                onClick={handleCopyLink}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconLink size={16} stroke={1.5} />
                Copy Link
              </button>
            )}
            {pkg.status === "DRAFT" && (
              <button
                onClick={() => handleStatusChange("ACTIVE")}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <IconCheck size={16} stroke={1.5} />
                Activate
              </button>
            )}
            {pkg.status === "ACTIVE" && (
              <button
                onClick={() => handleStatusChange("ARCHIVED")}
                className="btn-secondary text-sm"
              >
                Archive
              </button>
            )}
            {pkg.status === "ARCHIVED" && (
              <button
                onClick={() => handleStatusChange("DRAFT")}
                className="btn-secondary text-sm"
              >
                Move to Draft
              </button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <IconBook size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {pkg.courses.length}
            </p>
            <p className="text-xs text-muted-foreground">Courses</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <IconUsers size={20} className="text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {pkg._count.enrollments}
            </p>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <StatusBadge status={pkg.status} config={statusConfig} />
            </div>
          </div>
          {pkg.isInternship && (
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Internship
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Courses */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Courses in Package
          </h2>
        </div>
        {pkg.courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No courses in this package.
          </p>
        ) : (
          <div className="space-y-2">
            {pkg.courses.map((pc, index) => (
              <div
                key={pc.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {pc.course.title}
                    </p>
                    <p className="text-xs text-muted">
                      {pc.course._count.modules} modules ·{" "}
                      {pc.course._count.batches} batches
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={pc.course.status}
                  config={{
                    DRAFT: {
                      label: "Draft",
                      classes: "bg-slate-100 text-slate-600 border-slate-200",
                    },
                    PUBLISHED: {
                      label: "Published",
                      classes: "bg-success/15 text-success border-success/25",
                    },
                    ARCHIVED: {
                      label: "Archived",
                      classes: "bg-muted text-muted-foreground border-border",
                    },
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollments */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Enrolled Students
          </h2>
          {pkg.status === "ACTIVE" && !pkg.isInternship && (
            <button
              onClick={openEnrollModal}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <IconUsers size={14} stroke={1.5} />
              Enroll Student
            </button>
          )}
        </div>
        {pkg.enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No students enrolled yet.
          </p>
        ) : (
          <div className="space-y-2">
            {pkg.enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {enrollment.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {enrollment.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.user.email}
                    </p>
                    {enrollment.courses.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {enrollment.courses.map((ec) => (
                          <span
                            key={ec.courseId}
                            className="text-[10px] text-muted"
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
                  <StatusBadge
                    status={enrollment.status}
                    config={enrollmentStatusConfig}
                  />
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
      </div>

      {/* Enroll Student Modal */}
      {enrollModal && (
        <FormModal
          open={true}
          onClose={() => setEnrollModal(false)}
          title="Enroll Student in Package"
          footer={
            <>
              <button
                onClick={() => setEnrollModal(false)}
                className="btn-secondary text-sm"
                disabled={enrollMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending || !selectedStudentId}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {enrollMutation.isPending ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll"
                )}
              </button>
            </>
          }
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Student <span className="text-danger">*</span>
            </label>
            {loadingStudents ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : (
              <Select onValueChange={setSelectedStudentId}>
                <SelectTrigger className="field w-full">
                  <SelectValue placeholder="-- Select a student --" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No students available
                    </SelectItem>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-xs text-muted">
            Batches will be assigned when approving this enrollment.
          </p>
        </FormModal>
      )}

      {/* Approve Enrollment Modal — assign batches */}
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
              <span className="font-medium text-foreground">{pkg?.name}</span>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Assign a batch for each course:
            </p>
            <div className="space-y-3">
              {(pkg?.courses || []).map((pc) => (
                <CourseBatchSelect
                  key={pc.courseId}
                  courseId={pc.courseId}
                  courseTitle={pc.course.title}
                  value={batchAssignments[pc.courseId] || ""}
                  onChange={(val) =>
                    setBatchAssignments((prev) => ({
                      ...prev,
                      [pc.courseId]: val,
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
