"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IconDatabase, IconDownload, IconUpload, IconTrash, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type Backup = { filename: string; size: number; createdAt: string };

export default function BackupPage() {
  usePageTitle("Backup & Restore");
  const confirmDelete = useConfirmDialog();

  const backupsQuery = useApiQuery<{ backups: Backup[] }>(
    ["admin", "backup", "list"],
    "/api/admin/backup/list",
  );
  const backups = backupsQuery.data?.backups ?? [];
  const loading = backupsQuery.isPending;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<{ filename: string; size: number }>("/api/admin/backup", {}),
    onSuccess: (res) => {
      toast.success(`Backup created: ${res.filename}`);
      void backupsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleCreate() {
    createMutation.mutate();
  }

  const restoreMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<{ message: string }>(
        "/api/admin/backup/restore",
        formData,
      );
    },
    onSuccess: (res) => {
      toast.success(res.message);
      void backupsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleRestore = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sql";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (
        !(await confirmDelete({
          title: "Overwrite Database",
          message:
            "Are you sure? This will overwrite the current database. All data will be replaced with the backup contents.",
        }))
      )
        return;
      restoreMutation.mutate(file);
    };
    input.click();
  };

  const deleteMutation = useMutation({
    mutationFn: (filename: string) =>
      api.delete(`/api/admin/backup/${filename}`),
    onSuccess: () => {
      toast.success("Backup deleted");
      void backupsQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleDelete = async (filename: string) => {
    if (
      !(await confirmDelete({
        title: "Delete Backup",
        message: `Delete ${filename}?`,
      }))
    )
      return;
    deleteMutation.mutate(filename);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup & Restore</h1>
          <p className="text-foreground/60 mt-1">Create, download, and restore database backups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <IconDatabase size={16} />
            {createMutation.isPending ? "Creating..." : "Create Backup"}
          </button>
          <button
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 flex items-center gap-2"
          >
            <IconUpload size={16} />
            {restoreMutation.isPending ? "Restoring..." : "Restore"}
          </button>
          <button
            onClick={() => void backupsQuery.refetch()}
            className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/50 flex items-center gap-1"
          >
            <IconRefresh size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <IconAlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/60">
            Restoring a backup will overwrite the current database. This action cannot be undone.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-foreground/60">Loading backups...</p>
      ) : backups.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <IconDatabase size={40} className="mx-auto text-foreground/20 mb-3" />
          <p className="text-foreground/60">No backups yet</p>
          <p className="text-sm text-foreground/40">Create your first backup using the button above</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Filename</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Size</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Created</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-sm text-foreground/80">{b.filename}</td>
                  <td className="px-4 py-3 text-sm text-foreground/60">{formatSize(b.size)}</td>
                  <td className="px-4 py-3 text-sm text-foreground/60">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/api/admin/backup/download/${b.filename}`}
                        className="text-sm px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1"
                      >
                        <IconDownload size={14} /> Download
                      </a>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        className="text-sm px-2 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 inline-flex items-center gap-1"
                      >
                        <IconTrash size={14} /> Delete
                      </button>
                    </div>
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
