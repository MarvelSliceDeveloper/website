"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconUserCheck,
  IconRefresh,
  IconShield,
  IconSchool,
  IconChalkboardTeacher,
} from "@tabler/icons-react";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchPending = () => {
    setLoading(true);
    api
      .get<{ users: PendingUser[] }>("/api/admin/users/pending")
      .then((res) => {
        setUsers(res.users ?? []);
      })
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId: string, userName: string) => {
    setApproving(userId);
    try {
      await api.put(`/api/admin/users/${userId}/approve`);
      toast.success(`${userName} approved successfully`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApproving(null);
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "INSTRUCTOR":
        return <IconChalkboardTeacher size={14} />;
      case "STUDENT":
        return <IconSchool size={14} />;
      default:
        return <IconShield size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Instructor Approvals"
        description={`${users.length} pending approval${users.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={fetchPending}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <IconRefresh size={14} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <IconUserCheck size={40} stroke={1.2} />
          <p className="text-sm">No pending approvals</p>
          <p className="text-xs">
            All instructors have been reviewed and approved.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                  Registered
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={`border-b border-border/50 last:border-0 ${
                    i % 2 === 1 ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/15 text-xs font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-sky-100 text-sky-700 rounded">
                      {roleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleApprove(user.id, user.name)}
                      disabled={approving === user.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-success/20 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                    >
                      {approving === user.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-success border-t-transparent" />
                      ) : (
                        <IconUserCheck size={13} />
                      )}
                      {approving === user.id ? "Approving..." : "Approve"}
                    </button>
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
