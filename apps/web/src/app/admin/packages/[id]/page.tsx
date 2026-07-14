"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FormModal } from "@/components/admin/FormModal";
import { CardSkeleton } from "@/components/admin/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  IconArrowLeft,
  IconUsers,
  IconBook,
  IconCheck,
  IconX,
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
  description: string | null;
  price: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
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

const enrollmentStatusConfig: Record<string, { label: string; classes: string }> = {
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

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Enroll modal state
  const [enrollModal, setEnrollModal] = useState(false);
  const [students, setStudents] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Approve modal state
  const [approveModal, setApproveModal] = useState<PackageEnrollment | null>(
    null,
  );
  const [batchesMap, setBatchesMap] = useState<
    Record<string, Batch[]>
  >({});
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchAssignments, setBatchAssignments] = useState<
    Record<string, string>
  >({});
  const [approving, setApproving] = useState(false);

  const fetchPackage = async () => {
    try {
      const data = await api.get<PackageDetail>(`/api/admin/packages/${id}`);
      setPkg(data);
    } catch {
      toast.error("Failed to load package");
      router.push("/admin/packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackage();
  }, [id]);

  // Fetch batches for approve modal
  useEffect(() => {
    if (!approveModal) return;
    setLoadingBatches(true);
    setBatchAssignments({});

    const fetchAllBatches = async () => {
      const map: Record<string, Batch[]> = {};
      for (const course of pkg?.courses || []) {
        try {
          const data = await api.get<Batch[]>(
            `/api/admin/batches?courseId=${course.courseId}`,
          );
          map[course.courseId] = Array.isArray(data) ? data : [];
        } catch {
          map[course.courseId] = [];
        }
      }
      setBatchesMap(map);
      setLoadingBatches(false);
    };
    fetchAllBatches();
  }, [approveModal, pkg]);

  const handleStatusChange = async (
    status: "ACTIVE" | "ARCHIVED" | "DRAFT",
  ) => {
    try {
      await api.patch(`/api/admin/packages/${id}/status`, { status });
      toast.success(`Package ${status.toLowerCase()}`);
      fetchPackage();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudentId) return;
    setEnrolling(true);
    try {
      // Create enrollment with empty batch assignments (admin assigns later)
      const courseBatchAssignments = (pkg?.courses || []).map((c) => ({
        courseId: c.courseId,
        batchId: "", // Will be assigned during approval
      }));

      // Filter out empty batchIds - admin will assign during approval
      await api.post(`/api/admin/packages/${id}/enroll`, {
        userId: selectedStudentId,
        courseBatchAssignments: courseBatchAssignments.filter(
          (a) => a.batchId,
        ),
      });
      toast.success("Student enrolled in package");
      setEnrollModal(false);
      setSelectedStudentId("");
      fetchPackage();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    const assignments = Object.entries(batchAssignments)
      .filter(([_, batchId]) => batchId)
      .map(([courseId, batchId]) => ({ courseId, batchId }));

    if (assignments.length !== (pkg?.courses.length || 0)) {
      toast.error("Assign a batch for every course");
      return;
    }

    setApproving(true);
    try {
      await api.patch(
        `/api/admin/package-enrollments/${approveModal.id}/approve`,
        { courseBatchAssignments: assignments },
      );
      toast.success("Enrollment approved");
      setApproveModal(null);
      fetchPackage();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (enrollmentId: string) => {
    if (!confirm("Reject this enrollment?")) return;
    try {
      await api.patch(`/api/admin/package-enrollments/${enrollmentId}/reject`);
      toast.success("Enrollment rejected");
      fetchPackage();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openEnrollModal = async () => {
    setEnrollModal(true);
    setLoadingStudents(true);
    setSelectedStudentId("");
    try {
      const data = await api.get<{ users: { id: string; name: string; email: string }[] }>(
        "/api/users?role=STUDENT",
      );
      setStudents(data.users || []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
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
                      {pc.course._count.modules} modules · {pc.course._count.batches} batches
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
          {pkg.status === "ACTIVE" && (
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
                disabled={enrolling}
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling || !selectedStudentId}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {enrolling ? (
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
                disabled={approving}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {approving ? (
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
              (pkg?.courses || []).map((pc) => (
                <div key={pc.courseId}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {pc.course.title}
                  </label>
                  <Select
                    value={batchAssignments[pc.courseId] || ""}
                    onValueChange={(val) =>
                      setBatchAssignments((prev) => ({
                        ...prev,
                        [pc.courseId]: val,
                      }))
                    }
                  >
                    <SelectTrigger className="field w-full">
                      <SelectValue placeholder="-- Select Batch --" />
                    </SelectTrigger>
                    <SelectContent>
                      {(batchesMap[pc.courseId] || []).length === 0 ? (
                        <SelectItem value="none" disabled>
                          No batches for this course
                        </SelectItem>
                      ) : (
                        (batchesMap[pc.courseId] || []).map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} — {batch._count?.enrollments || 0}
                            {batch.maxStudents ? `/${batch.maxStudents}` : ""}{" "}
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
