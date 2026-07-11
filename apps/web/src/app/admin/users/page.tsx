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
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const roleFilter = searchParams.get("role") || "";

  // Create user modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "STUDENT" as string,
  });
  const [editing, setEditing] = useState(false);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api
      .get<User[]>("/api/users")
      .then(setUsers)
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setUsers([]);
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
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/api/users", form);
      setForm({ name: "", email: "", password: "", role: "STUDENT" });
      setShowModal(false);
      toast.success("User created successfully");
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
      await api.patch(`/api/users/${editUser.id}`, editForm);
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
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
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

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    total: users.length,
    INSTRUCTOR: users.filter((u) => u.role === "INSTRUCTOR").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
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
      key: "role",
      label: "Role",
      render: (_, user) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${roleStyles[user.role]}`}
          >
            {roleIcons[user.role]} {user.role}
          </span>
          {user.role === "INSTRUCTOR" && user.isSuspended && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
              Pending
            </span>
          )}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, user) => (
        <div className="flex items-center justify-end gap-2">
          {currentUserRole === "SUPER_ADMIN" &&
            user.role === "INSTRUCTOR" &&
            user.isSuspended && (
              <button
                onClick={() => handleApproveInstructor(user.id)}
                className="rounded-md border border-success/20 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/10 transition-colors"
                title="Approve instructor"
              >
                <IconCheck size={14} /> Approve
              </button>
            )}
          <button
            onClick={() => openEditModal(user)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
            title="Edit user"
          >
            <IconEdit size={14} /> Edit
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="rounded-md border border-danger/20 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
            title="Delete user"
          >
            <IconTrash size={14} /> Delete
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
            + Create User
          </button>
        }
      />

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
<<<<<<< HEAD
        {(["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const).map(
          (role) => (
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
=======
        {(["STUDENT", "INSTRUCTOR"] as const).map((role) => (
          <button
            key={role}
            onClick={() =>
              router.replace(
>>>>>>> 49c9d2685d29fee4ae1570bff3b89ae0cc0e138e
                roleFilter === role
                  ? roleStyles[role]
                  : "border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              <span>{roleIcons[role]}</span>
              {role} · {counts[role]}
            </button>
          ),
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="field max-w-sm"
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            variant="glass"
            icon={IconUsers}
            title="No users found"
            description="Try adjusting your filters."
          />
        }
      />

      {/* Create User Modal */}
      <FormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New User"
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
                  Creating...
                </>
              ) : (
                "Create User"
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
              onValueChange={(value) => setForm({ ...form, role: value })}
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
                setEditForm({ ...editForm, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
