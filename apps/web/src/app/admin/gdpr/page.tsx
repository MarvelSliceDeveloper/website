"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { IconSearch, IconDownload, IconTrash, IconUser, IconAlertTriangle } from "@tabler/icons-react";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";

type GdprUser = { id: string; name: string; email: string; role: string };

export default function GdprPage() {
  usePageTitle("GDPR Compliance");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [exporting, setExporting] = useState(false);
  const confirmDelete = useConfirmDialog();

  const searchQueryResult = useApiQuery<{ items: GdprUser[] }>(
    ["admin", "users", "search", submittedQuery],
    `/api/admin/users?search=${encodeURIComponent(submittedQuery)}&limit=10`,
    undefined,
    { enabled: submittedQuery.trim().length > 0 },
  );
  const users = searchQueryResult.data?.items ?? [];
  const loading = searchQueryResult.isPending;

  function searchUsers() {
    const q = searchQuery.trim();
    if (!q) return;
    setSubmittedQuery(q);
  }

  const handleExport = async (userId: string) => {
    setExporting(true);
    setSelectedUser(userId);
    setExportData(null);
    try {
      const res = await api.get<Record<string, unknown>>(`/api/admin/gdpr/export/${userId}`);
      setExportData(res);
      toast.success("User data exported");
    } catch {
      toast.error("Failed to export user data");
    } finally {
      setExporting(false);
    }
  };

  const anonymizeMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/api/admin/gdpr/anonymize/${userId}`, {}),
    onSuccess: () => {
      toast.success("User data anonymized successfully");
      setExportData(null);
      setSelectedUser(null);
      void searchQueryResult.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleAnonymize = async (userId: string) => {
    if (
      !(await confirmDelete({
        title: "Anonymize User Data",
        message:
          "Are you sure? This action is irreversible. The user's personal data will be permanently anonymized.",
      }))
    ) {
      return;
    }
    anonymizeMutation.mutate(userId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GDPR Compliance</h1>
        <p className="text-foreground/60 mt-1">Export or anonymize user personal data</p>
      </div>

      <div className="relative max-w-md">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      {loading && <p className="text-foreground/60">Searching...</p>}

      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconUser size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-foreground/60">{user.email} &middot; {user.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(user.id)}
                  disabled={exporting && selectedUser === user.id}
                  className="text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5"
                >
                  <IconDownload size={14} />
                  Export
                </button>
                <button
                  onClick={() => handleAnonymize(user.id)}
                  disabled={anonymizeMutation.isPending}
                  className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-1.5"
                >
                  <IconTrash size={14} />
                  Anonymize
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {exportData && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconDownload size={20} className="text-primary" />
            Exported Data
          </h2>
          <pre className="bg-muted/30 rounded-lg p-4 text-xs overflow-auto max-h-96 text-foreground/80">
            {JSON.stringify(exportData, null, 2)}
          </pre>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <IconAlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-500">Warning</p>
            <p className="text-sm text-foreground/60">
              Anonymization is irreversible. The user&apos;s name, email, and authentication data will be permanently removed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
