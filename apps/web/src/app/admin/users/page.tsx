"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
};

const roleStyles: Record<string, string> = {
  ADMIN: "bg-danger/15 text-danger border-danger/25",
  INSTRUCTOR: "bg-accent/15 text-accent border-accent/25",
  STUDENT: "bg-primary/15 text-primary-hover border-primary/25",
};

const roleIcons: Record<string, string> = {
  ADMIN: "🛡️",
  INSTRUCTOR: "👨‍🏫",
  STUDENT: "🎓",
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "STUDENT" as string });
  const [editing, setEditing] = useState(false);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get<User[]>("/api/users")
      .then(setUsers)
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchUsers());
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
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    INSTRUCTOR: users.filter((u) => u.role === "INSTRUCTOR").length,
    STUDENT: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{counts.total} registered users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          + Create User
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {(["STUDENT", "INSTRUCTOR", "ADMIN"] as const).map((role) => (
          <button
            key={role}
            onClick={() => router.replace(roleFilter === role ? "/admin/users" : `/admin/users?role=${role}`)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              roleFilter === role ? roleStyles[role] : "border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            <span>{roleIcons[role]}</span>
            {role} · {counts[role]}
          </button>
        ))}
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
      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium uppercase text-muted">User</th>
                <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Email</th>
                <th className="px-5 py-3 text-xs font-medium uppercase text-muted">Role</th>
                <th className="px-5 py-3 text-xs font-medium uppercase text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-card-hover/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-accent/20 text-xs font-bold text-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${roleStyles[user.role]}`}>
                      {roleIcons[user.role]} {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
                        title="Edit user"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="rounded-md border border-danger/20 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                        title="Delete user"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create New User</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                }}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Full Name</label>
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
                <label className="mb-1 block text-xs font-medium text-muted">Email Address</label>
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
                <label className="mb-1 block text-xs font-medium text-muted">Password</label>
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
                <label className="mb-1 block text-xs font-medium text-muted">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="field w-full"
                >
                  <option value="STUDENT">Student 🎓</option>
                  <option value="INSTRUCTOR">Instructor 👨‍🏫</option>
                  <option value="ADMIN">Administrator 🛡️</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                  }}
                  className="btn-secondary text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Edit User</h3>
              <button
                onClick={() => {
                  setEditUser(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="field"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="e.g. johndoe@lms.local"
                  className="field"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="field w-full"
                >
                  <option value="STUDENT">Student 🎓</option>
                  <option value="INSTRUCTOR">Instructor 👨‍🏫</option>
                  <option value="ADMIN">Administrator 🛡️</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setEditUser(null);
                  }}
                  className="btn-secondary text-sm"
                  disabled={editing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200 text-center">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-lg font-bold text-foreground">Delete User?</h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteUserId(null)}
                className="btn-secondary text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
