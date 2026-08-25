"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconRefresh, IconRestore, IconTrash } from "@tabler/icons-react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type TrashEntity = {
  id: string;
  type: string;
  name?: string;
  title?: string;
  email?: string;
  deletedAt: string;
};

export default function TrashPage() {
  usePageTitle("Trash");
  const [activeTab, setActiveTab] = useState("users");
  const confirmDelete = useConfirmDialog();

  const trashQuery = useApiQuery<{ trash: Record<string, TrashEntity[]> }>(
    ["admin", "trash"],
    "/api/admin/trash",
  );
  const trash = trashQuery.data?.trash ?? {};
  const loading = trashQuery.isPending;

  const restoreMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      api.post(`/api/admin/trash/${type}/${id}/restore`),
    onSuccess: (_res, vars) => {
      toast.success(`${vars.type} restored`);
      void trashQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleRestore(type: string, id: string) {
    restoreMutation.mutate({ type, id });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/admin/courses/${id}/permanent`),
    onSuccess: () => {
      toast.success("Course permanently deleted");
      void trashQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  async function handlePermanentDelete(id: string, title?: string) {
    if (
      !(await confirmDelete({
        title: "Permanently Delete Course",
        message: `Permanently delete "${title || "this course"}"? This will remove all associated modules, batches, enrollments, and data. This cannot be undone.`,
      }))
    )
      return;
    deleteMutation.mutate(id);
  }

  const tabs = [
    { key: "users", label: "Users" },
    { key: "courses", label: "Courses" },
    { key: "batches", label: "Batches" },
    { key: "sessions", label: "Sessions" },
    { key: "assignments", label: "Assignments" },
  ];

  const currentItems: TrashEntity[] = trash[activeTab] || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trash"
        description="Soft-deleted entities. Restore or permanently remove."
        breadcrumbs={[{ label: "Trash", href: "/admin/trash" }]}
        role="Administration"
        action={
          <button
            onClick={() => void trashQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-5 border border-border/80">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No deleted {activeTab} found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-3">Name</th>
                  <th className="py-2.5 pr-3">Deleted At</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {item.name ||
                        item.title ||
                        item.email ||
                        item.id.slice(0, 12)}
                    </td>
                    <td className="py-3 pr-3 text-muted whitespace-nowrap">
                      {new Date(item.deletedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleRestore(activeTab, item.id)}
                          className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1"
                        >
                          <IconRestore size={12} /> Restore
                        </button>
                        {activeTab === "courses" && (
                          <button
                            onClick={() =>
                              handlePermanentDelete(item.id, item.title)
                            }
                            disabled={
                              deleteMutation.isPending &&
                              deleteMutation.variables === item.id
                            }
                            className="text-danger hover:text-danger/70 text-[10px] flex items-center gap-1 disabled:opacity-50"
                          >
                            {deleteMutation.isPending &&
                            deleteMutation.variables === item.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-danger border-t-transparent" />
                            ) : (
                              <>
                                <IconTrash size={12} /> Delete Permanently
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
