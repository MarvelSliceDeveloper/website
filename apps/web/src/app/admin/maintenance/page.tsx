"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { useApiQuery } from "@/lib/query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  IconShieldCheck,
  IconShieldOff,
  IconRefresh,
  IconAlarmSmoke,
} from "@tabler/icons-react";

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export default function MaintenancePage() {
  usePageTitle("Maintenance Mode");
  const [message, setMessage] = useState("");

  const maintenanceQuery = useApiQuery<MaintenanceStatus>(
    ["admin", "maintenance"],
    "/api/admin/maintenance",
  );
  const status = maintenanceQuery.data ?? { enabled: false, message: "" };
  const loading = maintenanceQuery.isPending;

  useEffect(() => {
    if (maintenanceQuery.data) {
      setMessage(maintenanceQuery.data.message || "");
    }
  }, [maintenanceQuery.data]);

  const toggleMutation = useMutation({
    mutationFn: (body: MaintenanceStatus) =>
      api.put<MaintenanceStatus>("/api/admin/maintenance", body),
    onSuccess: (data) => {
      toast.success(
        data.enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
      );
      void maintenanceQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function handleToggle() {
    toggleMutation.mutate({
      enabled: !status.enabled,
      message: message.trim(),
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Maintenance Mode"
        description="Enable platform-wide maintenance mode to restrict public access."
        breadcrumbs={[
          { label: "Maintenance Mode", href: "/admin/maintenance" },
        ]}
        action={
          <button
            onClick={() => void maintenanceQuery.refetch()}
            className="btn-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="animate-pulse rounded-xl h-40 bg-card border border-border" />
      ) : (
        <div className="glass-card rounded-xl p-6 border border-border/80 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                status.enabled
                  ? "bg-danger/15 text-danger"
                  : "bg-success/15 text-success"
              }`}
            >
              {status.enabled ? (
                <IconAlarmSmoke size={24} />
              ) : (
                <IconShieldCheck size={24} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {status.enabled ? "Maintenance Active" : "Platform Operational"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {status.enabled
                  ? "Visitors see a maintenance message. Admins retain access."
                  : "All services are running normally."}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`btn text-sm py-2 px-5 shrink-0 ${
                status.enabled
                  ? "bg-gray-100 dark:bg-slate-800 text-foreground hover:bg-gray-200 dark:hover:bg-slate-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              } disabled:opacity-50`}
            >
              {toggleMutation.isPending
                ? "Saving..."
                : status.enabled
                  ? "Disable"
                  : "Enable"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Maintenance Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message shown to visitors during maintenance..."
              rows={3}
              className="input field w-full text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Shown to non-admin visitors when maintenance mode is enabled.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status.enabled ? "bg-danger" : "bg-success"
                }`}
              />
              <span>
                Status:{" "}
                {status.enabled
                  ? "Maintenance mode ON"
                  : "Maintenance mode OFF"}
              </span>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`btn-secondary text-xs py-1.5 px-4 ${
                status.enabled
                  ? "border-danger text-danger hover:bg-danger/10"
                  : ""
              }`}
            >
              {status.enabled ? (
                <>
                  <IconShieldOff size={14} className="mr-1" />
                  Turn Off
                </>
              ) : (
                <>
                  <IconShieldCheck size={14} className="mr-1" />
                  Turn On
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
