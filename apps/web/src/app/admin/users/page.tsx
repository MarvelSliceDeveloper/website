"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { usePageTitle } from "@/lib/use-page-title";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconSchool,
  IconUsers,
  IconEdit,
  IconTrash,
  IconDownload,
  IconEye,
  IconX,
  IconMail,
  IconPhone,
  IconHome,
  IconCalendar,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN" | "INTERN";
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  isSuspended?: boolean;
  packageEnrollments?: {
    package: { id: string; name: string };
    courses: { courseId: string; batchId: string | null }[];
  }[];
};

type PackageSummary = {
  id: string;
  name: string;
  count: number;
};

type QuizAttemptSummary = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  submittedAt: string | null;
  quiz: { id: string; title: string } | null;
};

type AssignmentSubmissionSummary = {
  id: string;
  submittedAt: string;
  status: string;
  grade: string | null;
  feedback: string | null;
  gradedAt: string | null;
  totalScore: number | null;
  assignment: { id: string; title: string; type: string } | null;
};

type UserDetail = User & {
  quizAttempts: QuizAttemptSummary[];
  assignmentSubmissions: AssignmentSubmissionSummary[];
};
type AdminPackage = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
};

type BatchResponse = {
  id: string;
  name: string;
  course: { title: string } | null;
  package: { name: string } | null;
  totalStudents: number;
  _count: { enrollments: number } | null;
  maxStudents: number | null;
};

const roleStyles: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-700",
};

const roleIcons: Record<string, React.ReactNode> = {
  STUDENT: <IconSchool size={14} />,
};

export default function AdminUsersPage() {
  usePageTitle("Students");
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const packageFilter = searchParams.get("packageId") || "";
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create user modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    packageId: "",
    batchId: "",
  });

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    packageId: "",
    batchId: "",
  });
  const [editing, setEditing] = useState(false);
  // Batches for edit modal's selected package
  const [editBatches, setEditBatches] = useState<
    {
      id: string;
      name: string;
      courseTitle: string;
      filledCount: number;
      maxStudents: number | null;
    }[]
  >([]);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Profile viewer
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [profileDetail, setProfileDetail] = useState<UserDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Active packages for create modal
  const [activePackages, setActivePackages] = useState<
    { id: string; name: string }[]
  >([]);

  // Batches for the selected package (flat list)
  const [packageBatches, setPackageBatches] = useState<
    {
      id: string;
      name: string;
      courseTitle: string;
      filledCount: number;
      maxStudents: number | null;
    }[]
  >([]);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("role", "STUDENT");
    if (packageFilter) params.set("packageId", packageFilter);

    api
      .get<{ users: User[]; packages: PackageSummary[] }>(
        `/api/users${params.toString() ? `?${params.toString()}` : ""}`,
      )
      .then((res) => {
        setUsers(res.users);
        setPackages(res.packages);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setUsers([]);
        setPackages([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchUsers());
  }, [packageFilter]);

  useEffect(() => {
    api
      .get<{ items: AdminPackage[] }>("/api/admin/packages")
      .then((res) => {
        const active = (res.items ?? []).filter(
          (p) => p.status === "ACTIVE",
        );
        setActivePackages(active.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.packageId) {
      setPackageBatches([]);
      return;
    }
    api
      .get<{ batches: BatchResponse[] }>("/api/admin/batches", { packageId: form.packageId })
      .then((res) => {
        const batches = res.batches ?? [];
        setPackageBatches(
          batches.map((b) => ({
            id: b.id,
            name: b.name,
            courseTitle: b.course?.title ?? b.package?.name ?? "All Courses",
             filledCount: b.totalStudents ?? b._count?.enrollments ?? 0,
             maxStudents: b.maxStudents ?? null,
          })),
        );
      })
      .catch(() => setPackageBatches([]));
  }, [form.packageId]);

  // Fetch batches when edit modal's package changes
  useEffect(() => {
    if (!editForm.packageId || !editUser) {
      setEditBatches([]);
      return;
    }
    api
      .get<{ batches: BatchResponse[] }>("/api/admin/batches", {
        packageId: editForm.packageId,
      })
      .then((res) => {
        const batches = res.batches ?? [];
        setEditBatches(
          batches.map((b) => ({
            id: b.id,
            name: b.name,
            courseTitle: b.course?.title ?? b.package?.name ?? "All Courses",
             filledCount: b.totalStudents ?? b._count?.enrollments ?? 0,
             maxStudents: b.maxStudents ?? null,
          })),
        );
      })
      .catch(() => setEditBatches([]));
  }, [editForm.packageId, editUser?.id]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!form.packageId) {
        toast.error("Please select a package for the student");
        setSubmitting(false);
        return;
      }

      await api.post("/api/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "STUDENT",
        packageId: form.packageId,
        batchId: form.batchId || undefined,
      });
      setForm({
        name: "",
        email: "",
        password: "",
        packageId: "",
        batchId: "",
      });
      setShowModal(false);
      toast.success("Student added successfully");
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditing(true);

    try {
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        role: "STUDENT",
      };
      if (editForm.packageId) payload.packageId = editForm.packageId;
      if (editForm.batchId) payload.batchId = editForm.batchId;
      await api.patch(`/api/users/${editUser.id}`, payload);
      setEditUser(null);
      toast.success("Student updated successfully");
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeleting(true);

    try {
      await api.delete(`/api/users/${deleteUserId}`);
      setDeleteUserId(null);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user: User) => {
    const currentPkg = user.packageEnrollments?.[0]?.package?.id ?? "";
    // Find the batch from the first enrollment course that has a batchId
    const currentBatch =
      user.packageEnrollments?.[0]?.courses?.find((c) => c.batchId)?.batchId ??
      "";
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      packageId: currentPkg,
      batchId: currentBatch,
    });
    // Load batches for the current package
    if (currentPkg) {
      api
        .get<{ batches: BatchResponse[] }>("/api/admin/batches", { packageId: currentPkg })
        .then((res) => {
          const batches = res.batches ?? [];
          setEditBatches(
            batches.map((b) => ({
              id: b.id,
              name: b.name,
              courseTitle: b.course?.title ?? b.package?.name ?? "All Courses",
              filledCount: b._count?.enrollments ?? 0,
              maxStudents: b.maxStudents ?? null,
            })),
          );
        })
        .catch(() => setEditBatches([]));
    } else {
      setEditBatches([]);
    }
  };

  const openProfile = async (user: User) => {
    setViewUser(user);
    setProfileDetail(null);
    setProfileLoading(true);
    try {
      const data = await api.get<UserDetail>(`/api/users/${user.id}`);
      setProfileDetail(data);
    } catch {
      setProfileDetail(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const escapeCsv = (value: unknown): string => {
      const str = String(value ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const header = [
      "S.No",
      "Name",
      "Email",
      "Phone",
      "Package(s)",
      "Status",
    ];
    const rows = filtered.map((u, index) => [
      index + 1,
      u.name,
      u.email,
      u.phone ?? "",
      u.packageEnrollments?.map((pe) => pe.package.name).join("; ") ?? "",
      u.isSuspended ? "Suspended" : "Active",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPage(1);
  }, [search, packageFilter]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesPackage =
      !packageFilter ||
      u.packageEnrollments?.some((pe) => pe.package.id === packageFilter);
    return matchesSearch && matchesPackage;
  });

  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalStudents = users.length;

  const columns: DataTableColumn<User>[] = [
    {
      key: "sno",
      label: "S.No",
      render: (_, __, index) => (
        <span className="text-sm text-muted-foreground">{index + 1}</span>
      ),
    },
    {
      key: "name",
      label: "User",
      render: (_, user) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">
            {user.name}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "package",
      label: "Package",
      render: (_, user) => {
        const pkgs =
          user.packageEnrollments?.map((pe) => pe.package.name) ?? [];
        return pkgs.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-700">
            {pkgs.join(", ")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_, user) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => openProfile(user)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="View Student"
          >
            <IconEye size={16} />
          </button>
          <button
            onClick={() => openEditModal(user)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit Student"
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="rounded-md border border-danger/20 p-2 text-danger hover:bg-danger/10 transition-colors"
            title="Delete Student"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Students"
        description={`${totalStudents} registered students`}
        breadcrumbs={[
          { label: "Students", href: "/admin/users" },
        ]}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm shadow-md"
          >
            + Add Student
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={handleDownloadCsv}
          disabled={filtered.length === 0}
          className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
          title="Download filtered students as CSV"
        >
          <IconDownload size={16} />
          Download CSV
        </button>

        <div className="max-w-sm">
          <SearchInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconUsers}
            title="No students found"
            description="Try adjusting your filters."
          />
        }
      />

      {/* Add Student Modal */}
      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Student"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-user-form"
              className="btn-primary text-sm flex items-center gap-1.5"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </button>
          </>
        }
      >
        <form
          id="create-user-form"
          onSubmit={handleCreateUser}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Email Address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. johndoe@lms.local"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Package <span className="text-danger">*</span>
            </label>
            <Select
              value={form.packageId || ""}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  packageId: value,
                  batchId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a package..." />
              </SelectTrigger>
              <SelectContent>
                {activePackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.packageId && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Batch <span className="text-danger">*</span>
              </label>
              <Select
                value={form.batchId || ""}
                onValueChange={(value) =>
                  setForm({ ...form, batchId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {packageBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.courseTitle}
                      {b.maxStudents
                        ? ` (${b.filledCount}/${b.maxStudents} filled, ${b.maxStudents - b.filledCount} remaining)`
                        : ` (${b.filledCount} enrolled, unlimited)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {packageBatches.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  No batches in this package yet — create one first
                </p>
              )}
            </div>
          )}
        </form>
      </FormModal>

      {/* Edit Student Modal */}
      <FormModal
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title="Edit Student"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="btn-secondary text-sm"
              disabled={editing}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-user-form"
              className="btn-primary text-sm flex items-center gap-1.5"
              disabled={editing}
            >
              {editing ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </>
        }
      >
        <form
          id="edit-user-form"
          onSubmit={handleEditUser}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Full Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="e.g. John Doe"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Email Address
            </label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              placeholder="e.g. johndoe@lms.local"
              className="field"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Package
            </label>
            <Select
              value={editForm.packageId || ""}
              onValueChange={(value) =>
                setEditForm({
                  ...editForm,
                  packageId: value,
                  batchId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a package..." />
              </SelectTrigger>
              <SelectContent>
                {activePackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {editForm.packageId && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Batch
              </label>
              <Select
                value={editForm.batchId || ""}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, batchId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {editBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.courseTitle}
                      {b.maxStudents
                        ? ` (${b.filledCount}/${b.maxStudents} filled, ${b.maxStudents - b.filledCount} remaining)`
                        : ` (${b.filledCount} enrolled, unlimited)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editBatches.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  No batches in this package yet
                </p>
              )}
            </div>
          )}
        </form>
      </FormModal>

      {/* User Profile Popup */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewUser(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${viewUser.name}'s profile`}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                    {viewUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground truncate">
                      {viewUser.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${roleStyles[viewUser.role]}`}
                      >
                        {roleIcons[viewUser.role]}
                        {viewUser.role}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${
                          viewUser.isSuspended
                            ? "bg-danger/10 text-danger"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {viewUser.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewUser(null)}
                  className="text-muted hover:text-foreground"
                  aria-label="Close profile"
                >
                  <IconX size={20} stroke={1.5} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                  Contact
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-foreground">
                    <IconMail size={16} className="shrink-0 text-muted" />
                    <span className="truncate">{viewUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-foreground">
                    <IconPhone size={16} className="shrink-0 text-muted" />
                    <span>{viewUser.phone || "—"}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-foreground">
                    <IconHome size={16} className="shrink-0 text-muted mt-0.5" />
                    <span>{viewUser.address || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-foreground">
                    <IconCalendar size={16} className="shrink-0 text-muted" />
                    <span>
                      Member since{" "}
                      {viewUser.createdAt
                        ? new Date(viewUser.createdAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                  Package Enrollments
                </h4>
                {viewUser.packageEnrollments &&
                viewUser.packageEnrollments.length > 0 ? (
                  <div className="space-y-2.5">
                    {viewUser.packageEnrollments.map((pe, idx) => (
                      <div
                        key={`${pe.package.id}-${idx}`}
                        className="rounded-lg border border-border bg-card-hover/40 p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {pe.package.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {pe.courses.length > 0
                            ? `${pe.courses.length} course${pe.courses.length === 1 ? "" : "s"} enrolled`
                            : "No courses"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No packages</p>
                )}
              </section>

              {viewUser.role === "STUDENT" && (
                <>
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                      Quiz Attempts
                    </h4>
                    {profileLoading ? (
                      <p className="text-sm text-muted animate-pulse">
                        Loading...
                      </p>
                    ) : profileDetail?.quizAttempts &&
                      profileDetail.quizAttempts.length > 0 ? (
                      <div className="space-y-2.5">
                        {profileDetail.quizAttempts.map((qa) => (
                          <div
                            key={qa.id}
                            className="rounded-lg border border-border bg-card-hover/40 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {qa.quiz?.title || "Quiz"}
                              </p>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  qa.isPassed
                                    ? "bg-success/10 text-success"
                                    : "bg-danger/10 text-danger"
                                }`}
                              >
                                {qa.isPassed ? "Passed" : "Failed"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              Score: {qa.score}/{qa.total} ({qa.percentage}%) ·{" "}
                              {qa.status === "PENDING"
                                ? "Pending"
                                : qa.submittedAt
                                  ? new Date(qa.submittedAt).toLocaleDateString()
                                  : "Not submitted"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No quiz attempts
                      </p>
                    )}
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                      Assignment Submissions
                    </h4>
                    {profileLoading ? (
                      <p className="text-sm text-muted animate-pulse">
                        Loading...
                      </p>
                    ) : profileDetail?.assignmentSubmissions &&
                      profileDetail.assignmentSubmissions.length > 0 ? (
                      <div className="space-y-2.5">
                        {profileDetail.assignmentSubmissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="rounded-lg border border-border bg-card-hover/40 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {sub.assignment?.title || "Assignment"}
                              </p>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  sub.status === "GRADED"
                                    ? "bg-success/10 text-success"
                                    : sub.status === "PENDING"
                                      ? "bg-warning/10 text-warning"
                                      : "bg-muted/15 text-muted-foreground"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                              {sub.grade
                                ? ` · Grade: ${sub.grade}`
                                : sub.totalScore != null
                                  ? ` · Score: ${sub.totalScore}`
                                  : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No submissions
                      </p>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <button
                onClick={() => {
                  setViewUser(null);
                  openEditModal(viewUser);
                }}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconEdit size={15} />
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Delete Student?"
        description="This action cannot be undone. All data associated with this student will be permanently removed."
        variant="danger"
        confirmLabel="Yes, Delete"
        confirmLoading={deleting}
      />
    </div>
  );
}
