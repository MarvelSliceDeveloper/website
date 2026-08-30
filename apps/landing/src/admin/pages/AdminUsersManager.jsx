import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import PageShell from "../components/ui/PageShell";
import AdminButton from "../components/AdminButton";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { SubmitButton, CancelButton } from "../components/FormButtons";
import { useAuth } from "../context/AuthContext";
import {
  FiUsers,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiX,
  FiEdit3,
  FiArrowLeft,
} from "react-icons/fi";
import useConfirm from "../hooks/useConfirm";

const ALL_ROLES = [
  { value: "master_admin", label: "Master Admin", desc: "Full access — can create all roles", rank: 4 },
  { value: "admin", label: "Admin", desc: "Full access", rank: 3 },
  { value: "manager", label: "Manager", desc: "Manage content & users", rank: 2 },
  { value: "editor", label: "Editor", desc: "Manage content", rank: 1 },
];

const ROLE_RANK = Object.fromEntries(ALL_ROLES.map((r) => [r.value, r.rank]));

export default function AdminUsersManager() {
const [confirm, confirmDialog] = useConfirm();
  const { user: currentUser } = useAuth();
  const userRank = ROLE_RANK[currentUser?.role] || 0;
  const availableRoles = currentUser?.role === 'master_admin' ? ALL_ROLES : ALL_ROLES.filter((r) => r.rank < userRank);
  const [role, setRole] = useState(availableRoles[0]?.value || "editor");

  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    supabase
      .rpc("list_admins", { p_viewer_id: currentUser.id })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setUsers([]);
        } else {
          setUsers(data || []);
        }
        setLoading(false);
      });
  }, [currentUser]);

  if (userRank < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-admin-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-black mb-2">Access Denied</h1>
          <p className="text-sm text-neutral-500">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  function resetForm() {
    setEmail("");
    setName("");
    setRole("editor");
    setPassword("");
    setShowPw(false);
    setEditingId(null);
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEmail(u.email);
    setName(u.full_name);
    setRole(availableRoles.some((r) => r.value === u.role) ? u.role : availableRoles[0]?.value || "editor");
    setPassword("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !name.trim()) {
      setError("Name and email are required");
      return;
    }
    if (!editingId && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { data, error: updateError } = await supabase.rpc(
          "update_admin",
          {
            p_editor_id: currentUser.id,
            p_target_id: editingId,
            p_email: email.trim(),
            p_full_name: name.trim(),
            p_role: role,
            p_password: password || null,
          },
        );

        if (updateError) {
          setError(updateError.message);
        } else {
          setUsers(
            users.map((u) =>
              u.id === editingId
                ? { ...u, email: data.email, full_name: data.full_name, role: data.role }
                : u,
            ),
          );
          resetForm();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } else {
        const { data, error: insertError } = await supabase.rpc(
          "create_admin",
          { p_creator_id: currentUser.id, p_email: email.trim(), p_full_name: name.trim(), p_role: role, p_password: password },
        );

        if (insertError) {
          setError(insertError.message);
        } else {
          setUsers([data, ...users]);
          resetForm();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function deleteUser(id) {
    if (!(await confirm("Remove this admin?"))) return;
    await supabase.rpc("delete_admin", {
      p_creator_id: currentUser.id,
      p_target_id: id,
    });
    setUsers(users.filter((u) => u.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin" title="Admin Users" subtitle="Create and manage admin accounts with credentials"
    >

      {saved && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2 text-success-700 text-sm">
          <FiCheck className="w-4 h-4" /> {editingId ? "Admin updated!" : "Admin added successfully!"}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-destructive-50 border border-destructive-200 rounded-lg text-destructive-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="rounded-lg border border-admin-200 bg-white p-5 mb-6">
        <h3 className="text-sm font-semibold text-black mb-4">
          {editingId ? "Edit Admin" : "Add New Admin"}
        </h3>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
                placeholder="John Doe" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white appearance-none cursor-pointer">
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
                Password{" "}
                {editingId && <span className="text-neutral-400 font-normal normal-case">(leave blank to keep)</span>}
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  minLength={editingId ? 0 : 6} required={!editingId} autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
                  placeholder={editingId ? "Leave blank to keep" : "Min 6 characters"} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-admin-400 hover:text-admin-700 transition-colors">
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <SubmitButton type="submit" saving={saving} savingLabel="Saving..." label={editingId ? 'Save' : 'Submit'} />
            {editingId && (
              <CancelButton onClick={resetForm} />
            )}
            <AdminButton type="button" variant="ghost" size="md" onClick={resetForm}>Clear</AdminButton>
          </div>
        </div>
      </form>

      {users.length === 0 ? (
        <EmptyState icon={FiUsers} title="No admin users yet" description="Add your first admin above" />
      ) : (
        <div className="rounded-lg border border-admin-200 bg-white overflow-hidden">
          <div className="divide-y divide-admin-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white transition-colors group">
                <div className="w-9 h-9 bg-admin-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-neutral-700">
                    {(u.full_name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black">{u.full_name}</p>
                  <p className="text-xs text-neutral-400">{u.email}</p>
                </div>
                <Badge variant={u.role}>{u.role.replace('_', ' ')}</Badge>
                {((ROLE_RANK[u.role] || 0) < userRank || currentUser?.role === 'master_admin') && currentUser?.id !== u.id && (
                  <>
                    <button onClick={() => startEdit(u)}
                      className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteUser(u.id)}
                      className="px-3 py-1.5 text-xs font-medium text-destructive-600 bg-destructive-50 hover:bg-destructive-100 rounded-md transition-colors">
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {confirmDialog}
    </PageShell>
  );
}
