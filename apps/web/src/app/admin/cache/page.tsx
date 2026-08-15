"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { useApiQuery } from "@/lib/query";
import {
  IconDatabase,
  IconRefresh,
  IconTrash,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";

type CacheStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
  lastFlushAt: string | null;
};

export default function CachePage() {
  const queryClient = useQueryClient();
  const [showFlushConfirm, setShowFlushConfirm] = useState(false);

  const cacheQuery = useApiQuery<{ data: CacheStatus }>(
    ["admin", "cache", "status"],
    "/api/admin/cache/status",
  );
  const status = cacheQuery.data?.data ?? null;
  const loading = cacheQuery.isPending;

  const flushMutation = useMutation({
    mutationFn: () => api.post<{ flushedAt: string }>("/api/admin/cache/flush"),
    onSuccess: (res) => {
      setShowFlushConfirm(false);
      toast.success("Cache flushed");
      queryClient.setQueryData<{ data: CacheStatus }>(
        ["admin", "cache", "status"],
        (old) =>
          old ? { data: { ...old.data, lastFlushAt: res.flushedAt } } : old,
      );
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleFlush() {
    flushMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cache Management"
        description="Monitor and manage platform cache"
        breadcrumbs={[{ label: "Cache", href: "/admin/cache" }]}
        action={
          <button
            onClick={() => void cacheQuery.refetch()}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <IconRefresh size={14} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading cache status...</p>
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status card */}
          <div className="glass-card border border-border/80 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <IconDatabase size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Connection Status
                </p>
                <p className="text-sm text-muted-foreground">
                  Redis cache backend
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Configured
                </span>
                {status.configured ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                    <IconCircleCheck size={16} />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground font-medium">
                    <IconCircleX size={16} />
                    No
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected</span>
                {status.configured ? (
                  status.connected ? (
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                      <IconCircleCheck size={16} />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
                      <IconCircleX size={16} />
                      No
                    </span>
                  )
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </div>

              <div className="rounded-lg bg-card-hover/50 p-3">
                <p className="text-xs text-muted-foreground">
                  {status.message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="glass-card border border-border/80 p-6 space-y-5">
            <div>
              <p className="font-semibold text-foreground">Cache Actions</p>
              <p className="text-sm text-muted-foreground">
                Manage cache data and monitor flush history
              </p>
            </div>

            <div className="space-y-4">
              {status.lastFlushAt && (
                <div className="rounded-lg bg-card-hover/50 p-3">
                  <p className="text-xs text-muted">Last flushed</p>
                  <p className="text-sm text-foreground font-medium">
                    {new Date(status.lastFlushAt).toLocaleString()}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowFlushConfirm(true)}
                disabled={!status.configured}
                className="btn-danger text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconTrash size={14} />
                Flush Cache
              </button>
              {!status.configured && (
                <p className="text-xs text-muted-foreground">
                  Redis must be configured to flush cache. Set REDIS_URL in your
                  environment variables.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Flush confirmation */}
      <ConfirmModal
        open={showFlushConfirm}
        onClose={() => setShowFlushConfirm(false)}
        onConfirm={handleFlush}
        title="Flush Cache?"
        description="This will clear all cached data. The application may experience temporary performance degradation until the cache is rebuilt."
        variant="danger"
        confirmLabel="Yes, Flush"
        confirmLoading={flushMutation.isPending}
      />
    </div>
  );
}
