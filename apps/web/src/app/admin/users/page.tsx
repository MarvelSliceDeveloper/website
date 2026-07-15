"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import DataTable from "@/components/admin/DataTable";
import type { DataTableColumn } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  IconShield,
  IconChalkboardTeacher,
  IconSchool,
  IconUsers,
  IconEdit,
  IconTrash,
  IconCheck,
  IconSearch,
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
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";
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

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  INSTRUCTOR: "bg-sky-100 text-sky-700",
  STUDENT: "bg-blue-100 text-blue-700",
};

const roleIcons: Record<string, React.ReactNode> = {
  SUPER_ADMIN: <IconShield size={14} />,
  ADMIN: <IconShield size={14} />,
  INSTRUCTOR: <IconChalkboardTeacher size={14} />,
  STUDENT: <IconSchool size={14} />,
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const roleFilter = searchParams.get("role") || "";
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
    role: "STUDENT",
    packageId: "",
    batchId: "",
  });

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "STUDENT" as string,
    packageId: "",
    batchId: "",
  });
  const [editing, setEditing] = useState(false);
  // Batches for edit modal's selected package
  const [editBatches, setEditBatches] = useState<
    {
      id: string
      name: string
      courseTitle: string
      filledCount: number
      maxStudents: number | null
    }[]
  >([]);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active packages for create modal
  const [activePackages, setActivePackages] = useState<
    { id: string; name: string }[]
  >([]);

  // Batches for the selected package (flat list)
  const [packageBatches, setPackageBatches] = useState<
    {
      id: string
      name: string
      courseTitle: string
      filledCount: number
      maxStudents: number | null
    }[]
  >([]);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
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
    api
      .get<{ user: { role: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) setCurrentUserRole(res.user.role);
      })
      .catch(() => {});
  }, [packageFilter]);

  useEffect(() => {
    api
      .get<{ packages: any[] }>("/api/admin/packages")
      .then((res) => {
        const active = (res.packages ?? []).filter(
          (p: any) => p.status === "ACTIVE",
        );
        setActivePackages(active.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.packageId) {
      setPackageBatches([]);
      return;
    }
    api
      .get<{ id: string; name: string; course: { title: string } }[]>(
        "/api/admin/batches",
        { packageId: form.packageId },
      )
      .then((res: any) => {
        const batches = Array.isArray(res) ? res : [];
        setPackageBatches(
          batches.map((b: any) => ({
            id: b.id,
            name: b.name,
            courseTitle: b.course?.title ?? b.package?.name ?? "All Courses",
            filledCount: b._count?.enrollments ?? 0,
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
      .get<{ id: string; name: string; course: { title: string } }[]>(
        "/api/admin/batches",
        { packageId: editForm.packageId },
      )
      .then((res: any) => {
        const batches = Array.isArray(res) ? res : [];
        setEditBatches(
          batches.map((b: any) => ({
            id: b.id,
            name: b.name,
            courseTitle: b.course?.title ?? b.package?.name ?? "All Courses",
            filledCount: b._count?.enrollments ?? 0,
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
      // Validate: students must have a package
      if (form.role === "STUDENT" && !form.packageId) {
        toast.error("Please select a package for the student");
        setSubmitting(false);
        return;
      }

      await api.post("/api/users", {
        ...form,
        packageId: form.packageId || undefined,
        batchId: form.batchId || undefined,
      });
      setForm({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        packageId: "",
        batchId: "",
      });
      setShowModal(false);
      toast.success("User added successfully");
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
        role: editForm.role,
      };
      // Only send package/batch for students
      if (editForm.role === "STUDENT") {
        if (editForm.packageId) payload.packageId = editForm.packageId;
        if (editForm.batchId) payload.batchId = editForm.batchId;
      }
      await api.patch(`/api/users/${editUser.id}`, payload);
      setEditUser(null);
      toast.success("User updated successfully");
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
      role: user.role,
      packageId: currentPkg,
      batchId: currentBatch,
    });
    // Load batches for the current package
    if (currentPkg) {
      api
        .get<{ id: string; name: string; course: { title: string } }[]>(
          "/api/admin/batches",
          { packageId: currentPkg },
        )
        .then((res: any) => {
          const batches = Array.isArray(res) ? res : [];
          setEditBatches(
            batches.map((b: any) => ({
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

  const handleApproveInstructor = async (userId: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/approve`);
      toast.success("Instructor approved successfully");
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, packageFilter]);

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesPackage =
      !packageFilter ||
      u.packageEnrollments?.some((pe) => pe.package.id === packageFilter);
    return matchesSearch && matchesRole && matchesPackage;
  });

  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    total: users.length,
    INSTRUCTOR: users.filter((u) => u.role === "INSTRUCTOR").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    SUPER_ADMIN: users.filter((u) => u.role === "SUPER_ADMIN").length,
  };

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
      key: "role",
      label: "Role",
      render: (_, user) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${roleStyles[user.role]}`}
        >
          {roleIcons[user.role]}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, user) => (
        <div className="flex items-center justify-end gap-1">
          {currentUserRole === "SUPER_ADMIN" &&
            user.role === "INSTRUCTOR" &&
            user.isSuspended && (
              <button
                onClick={() => handleApproveInstructor(user.id)}
                className="rounded-md border border-success/20 p-1.5 text-success hover:bg-success/10 transition-colors"
                title="Approve instructor"
              >
                <IconCheck size={14} />
              </button>
            )}
          <button
            onClick={() => openEditModal(user)}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit user"
          >
            <IconEdit size={14} />
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="rounded-md border border-danger/20 p-1.5 text-danger hover:bg-danger/10 transition-colors"
            title="Delete user"
          >
            <IconTrash size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description={`${counts.total} registered users`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm shadow-md"
          >
            + Add User
          </button>
        }
      />

      {/* Package filter chips — only visible when STUDENT filter is active */}
      {roleFilter === "STUDENT" && packages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() =>
                router.replace(
                  packageFilter === pkg.id
                    ? `/admin/users?role=STUDENT`
                    : `/admin/users?role=STUDENT&packageId=${pkg.id}`,
                )
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                packageFilter === pkg.id
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              {pkg.name} · {pkg.count}
            </button>
          ))}
        </div>
      )}

      {/* Role filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const)
          .filter(
            (role) =>
              currentUserRole === "SUPER_ADMIN" ||
              (role !== "ADMIN" && role !== "SUPER_ADMIN"),
          )
          .map((role) => (
            <button
              key={role}
              onClick={() =>
                router.replace(
                  roleFilter === role
                    ? "/admin/users"
                    : `/admin/users?role=${role}`,
                )
              }
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                roleFilter === role
                  ? roleStyles[role]
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              <span>{roleIcons[role]}</span>
              {role} · {counts[role]}
            </button>
          ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="field field-search w-full"
          />
        </div>
        <button
          onClick={() => setPage(1)}
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
          title="Search"
        >
          <IconSearch size={16} />
        </button>
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
            title="No users found"
            description="Try adjusting your filters."
          />
        }
      />

      {/* Add User Modal */}
      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New User"
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
                "Add User"
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
              Role
            </label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  role: value,
                  packageId: "",
                  batchId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                {currentUserRole === "SUPER_ADMIN" && (
                  <>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {form.role === "STUDENT" && (
            <>
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
            </>
          )}
        </form>
      </FormModal>

      {/* Edit User Modal */}
      <FormModal
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title="Edit User"
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
              Role
            </label>
            <Select
              value={editForm.role}
              onValueChange={(value) =>
                setEditForm({
                  ...editForm,
                  role: value,
                  packageId: "",
                  batchId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                {currentUserRole === "SUPER_ADMIN" && (
                  <>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {editForm.role === "STUDENT" && (
            <>
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
            </>
          )}
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User?"
        description="This action cannot be undone. All data associated with this user will be permanently removed."
        variant="danger"
        confirmLabel="Yes, Delete"
        confirmLoading={deleting}
      />
    </div>
  );
}
