"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePageTitle } from "@/lib/use-page-title";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconSend, IconRefresh } from "@tabler/icons-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  targetRole: string;
  targetType: string;
  targetIds: string[];
  createdAt: string;
};

type PackageOption = { id: string; name: string };
type BatchOption = { id: string; name: string; course: { title: string } };

const TARGET_TYPES = [
  { value: "ROLE", label: "By Role" },
  { value: "PACKAGE", label: "By Package" },
  { value: "BATCH", label: "By Batch" },
  { value: "INSTRUCTOR_BATCH", label: "Instructors by Batch" },
];

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "STUDENT", label: "Student" },
];

export default function AnnouncementsPage() {
  usePageTitle("Announcements");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("ROLE");
  const [targetRole, setTargetRole] = useState("STUDENT");
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    new Set(),
  );

  const announcementsQuery = useApiQuery<{ announcements: Announcement[] }>(
    ["admin", "announcements"],
    "/api/admin/announcements",
  );
  const announcements = announcementsQuery.data?.announcements ?? [];
  const loading = announcementsQuery.isPending;

  const packagesQuery = useApiQuery<{ packages: PackageOption[] }>(
    ["admin", "announcements", "packages"],
    "/api/admin/announcements/packages",
  );
  const packages = packagesQuery.data?.packages ?? [];

  const batchesQuery = useApiQuery<{ batches: BatchOption[] }>(
    ["admin", "announcements", "batches"],
    "/api/admin/announcements/batches",
  );
  const batches = batchesQuery.data?.batches ?? [];

  const sendMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      body: string;
      targetType: string;
      targetRole: string;
      targetIds: string[];
    }) =>
      api.post<{ notifiedCount: number }>("/api/admin/announcements", payload),
    onSuccess: (res) => {
      toast.success(`Announcement sent to ${res.notifiedCount} user(s)`);
      setTitle("");
      setBody("");
      setTargetType("ROLE");
      setTargetRole("STUDENT");
      setSelectedPackageIds(new Set());
      setSelectedBatchIds(new Set());
      setShowCreate(false);
      void announcementsQuery.refetch();
    },
    onError: () => toast.error("Failed to send announcement"),
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return;

    let targetIds: string[] = [];
    if (targetType === "ROLE") {
      targetIds = [targetRole];
    } else if (targetType === "PACKAGE") {
      targetIds = Array.from(selectedPackageIds);
    } else {
      targetIds = Array.from(selectedBatchIds);
    }

    if (targetIds.length === 0) {
      toast.error("Select at least one target");
      return;
    }

    sendMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      targetType,
      targetRole,
      targetIds,
    });
  };

  function togglePackage(id: string) {
    setSelectedPackageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatTargetLabel(a: Announcement) {
    switch (a.targetType) {
      case "ROLE":
        return a.targetRole;
      case "PACKAGE":
        return `Package (${(a.targetIds || []).length})`;
      case "BATCH":
        return `Batch (${(a.targetIds || []).length})`;
      case "INSTRUCTOR_BATCH":
        return `Instructor Batch (${(a.targetIds || []).length})`;
      default:
        return a.targetRole;
    }
  }

  function getTargetTypeLabel(value: string) {
    return TARGET_TYPES.find((t) => t.value === value)?.label || value;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Announcements"
        description="Send broadcast announcements with in-app notification + email."
        breadcrumbs={[{ label: "Announcements", href: "/admin/announcements" }]}
        role="Administration"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-xs py-2 flex items-center gap-1.5"
          >
            <IconSend size={14} /> New Announcement
          </button>
        }
      />

      {showCreate && (
        <div className="glass-card p-5 border border-primary/30 space-y-3">
          <input
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input text-xs w-full"
          />
          <textarea
            placeholder="Announcement body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input text-xs w-full min-h-[100px]"
          />

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Target Type
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="input text-xs w-full"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {targetType === "ROLE" && (
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="input text-xs w-full"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {targetType === "PACKAGE" && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Select Packages
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
                {packages.length === 0 && (
                  <p className="py-3 text-center text-xs text-muted">
                    No active packages
                  </p>
                )}
                {packages.map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      selectedPackageIds.has(p.id)
                        ? "bg-primary/10 text-primary-hover"
                        : "text-foreground hover:bg-card-hover"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPackageIds.has(p.id)}
                      onChange={() => togglePackage(p.id)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {(targetType === "BATCH" || targetType === "INSTRUCTOR_BATCH") && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {targetType === "INSTRUCTOR_BATCH"
                  ? "Select Batches (Instructors)"
                  : "Select Batches"}
              </label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 p-2">
                {batches.length === 0 && (
                  <p className="py-3 text-center text-xs text-muted">
                    No batches found
                  </p>
                )}
                {batches.map((b) => (
                  <label
                    key={b.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      selectedBatchIds.has(b.id)
                        ? "bg-primary/10 text-primary-hover"
                        : "text-foreground hover:bg-card-hover"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatchIds.has(b.id)}
                      onChange={() => toggleBatch(b.id)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary"
                    />
                    <span className="flex-1">
                      {b.name}
                      <span className="ml-2 text-muted">
                        {b.course?.title || ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || !title.trim() || !body.trim()}
              className="btn-primary text-xs py-2 disabled:opacity-40"
            >
              {sendMutation.isPending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-xs py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-5 border border-border/80">
        <button
          onClick={() => void announcementsQuery.refetch()}
          className="btn-secondary text-xs py-2 flex items-center gap-1.5 mb-4"
        >
          <IconRefresh size={14} /> Refresh
        </button>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted animate-pulse">
            Loading...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No announcements yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border border-border/60 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      {a.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted whitespace-nowrap ml-4">
                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {getTargetTypeLabel(a.targetType)}
                  </span>
                  <span className="text-[10px] font-mono bg-muted/10 text-muted-foreground px-1.5 py-0.5 rounded">
                    {formatTargetLabel(a)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
