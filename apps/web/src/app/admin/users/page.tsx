"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    api.get<User[]>("/api/users")
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{counts.total} registered users</p>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {(["STUDENT", "INSTRUCTOR", "ADMIN"] as const).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "" : role)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${roleFilter === role ? roleStyles[role] : "border-border text-muted-foreground hover:bg-card-hover"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
