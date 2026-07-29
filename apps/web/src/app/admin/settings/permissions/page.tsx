"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { IconLock, IconRefresh } from "@tabler/icons-react";

type Override = {
  id: string;
  role: string;
  permission: string;
  allowed: boolean;
};

const DEFAULT_PERMISSIONS = [
  { permission: "course.create", label: "Add Course" },
  { permission: "course.edit", label: "Edit Course" },
  { permission: "course.delete", label: "Delete Course" },
  { permission: "course.view.all", label: "View All Courses" },
  { permission: "batch.create", label: "Add Batch" },
  { permission: "batch.edit", label: "Edit Batch" },
  { permission: "batch.delete", label: "Delete Batch" },
  { permission: "session.create", label: "Create Session" },
  { permission: "session.edit", label: "Edit Session" },
  { permission: "session.delete", label: "Delete Session" },
  { permission: "student.create", label: "Add Student" },
  { permission: "enrollment.manage", label: "Manage Enrollments" },
  { permission: "assignment.create", label: "Add Assignment" },
  { permission: "assignment.grade", label: "Grade Assignments" },
  { permission: "mentorship.answer", label: "Answer Mentorship" },
];

const ROLES = ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"];

export default function PermissionsPage() {
  usePageTitle("Permissions");
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<Override[]>([]);
  const [saving, setSaving] = useState(false);

  async function fetchOverrides() {
    setLoading(true);
    try {
      const data = await api.get<{ overrides: Override[] }>(
        "/api/admin/permissions",
      );
      setOverrides(data.overrides);
      setLocalOverrides(data.overrides);
      setDirty(false);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverrides();
  }, []);

  function isAllowed(role: string, permission: string): boolean {
    const override = localOverrides.find(
      (o) => o.role === role && o.permission === permission,
    );
    if (override) return override.allowed;
    const hasAdminPrivilege = role === "SUPER_ADMIN" || role === "ADMIN";
    const defaults: Record<string, boolean> = {
      "course.create": hasAdminPrivilege,
      "course.edit": hasAdminPrivilege,
      "course.delete": role === "SUPER_ADMIN",
      "course.view.all": hasAdminPrivilege,
      "batch.create": hasAdminPrivilege,
      "batch.edit": hasAdminPrivilege,
      "batch.delete": role === "SUPER_ADMIN",
      "session.create": hasAdminPrivilege,
      "session.edit": hasAdminPrivilege,
      "session.delete": role === "SUPER_ADMIN",
      "student.create": hasAdminPrivilege,
      "enrollment.manage": hasAdminPrivilege,
      "assignment.create": role === "INSTRUCTOR",
      "assignment.grade": role === "INSTRUCTOR",
      "mentorship.answer": role === "INSTRUCTOR",
    };
    return defaults[permission] ?? false;
  }

  function toggleLocal(role: string, permission: string) {
    setLocalOverrides((prev) => {
      const existing = prev.find(
        (o) => o.role === role && o.permission === permission,
      );
      if (existing) {
        return prev.map((o) =>
          o.role === role && o.permission === permission
            ? { ...o, allowed: !o.allowed }
            : o,
        );
      }
      return [
        ...prev,
        {
          id: `new-${role}-${permission}`,
          role,
          permission,
          allowed: !isAllowed(role, permission),
        },
      ];
    });
    setDirty(true);
  }

  function isToggled(role: string, permission: string): boolean {
    const local = localOverrides.find(
      (o) => o.role === role && o.permission === permission,
    );
    if (local) return local.allowed;
    return isAllowed(role, permission);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/api/admin/permissions", { overrides: localOverrides });
      toast.success("Permissions saved successfully");
      setOverrides(localOverrides);
      setDirty(false);
    } catch {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">
            Settings
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl flex items-center gap-3">
            <IconLock size={28} className="text-primary-hover" />
            Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle granular permissions for SUPER_ADMIN, ADMIN, and INSTRUCTOR
            roles. Changes are local until saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={fetchOverrides}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading permissions...</p>
        </div>
      ) : (
        <div className="glass-card p-5 border border-border/80 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                <th className="py-2.5 pr-4">Permission</th>
                {ROLES.map((role) => (
                  <th key={role} className="py-2.5 pr-4 text-center">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {DEFAULT_PERMISSIONS.map((perm) => (
                <tr
                  key={perm.permission}
                  className="hover:bg-card-hover transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {perm.label}
                    <span className="block text-[10px] font-mono text-muted-foreground">
                      {perm.permission}
                    </span>
                  </td>
                  {ROLES.map((role) => (
                    <td key={role} className="py-3 pr-4 text-center">
                      <button
                        onClick={() => toggleLocal(role, perm.permission)}
                        className={`w-10 h-6 rounded-full transition-all duration-200 relative ${
                          isToggled(role, perm.permission)
                            ? "bg-primary"
                            : "bg-gray-200 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-200 ${
                            isToggled(role, perm.permission)
                              ? "translate-x-[18px]"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
