"use client";

import { useApiQuery } from "@/lib/query";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { toast } from "@/lib/toast";
import { IconCopy, IconCheck, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";

interface VersionDetails {
  name: string;
  version: string;
  env: string;
  buildTime: string;
  commit: string;
  commitShort: string;
  changelog: string | null;
}

export default function VersionPage() {
  usePageTitle("Version");
  const [copied, setCopied] = useState<string | null>(null);

  const q = useApiQuery<VersionDetails>(
    ["admin", "version"],
    "/api/version/details",
  );

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const info = q.data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AdminPageHeader
        title="Version"
        description="Current deployment version, build info, and changelog."
        breadcrumbs={[
          { label: "Super Admin", href: "/admin/super-admin" },
          { label: "Version" },
        ]}
      />

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive flex items-center justify-between">
          <span>Failed to load version info.</span>
          <button
            onClick={() => q.refetch()}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <IconRefresh size={14} /> Retry
          </button>
        </div>
      ) : info ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Version
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  v{info.version}
                </p>
                <button
                  onClick={() => copy(info.version, "version")}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover"
                  aria-label="Copy version"
                >
                  {copied === "version" ? (
                    <IconCheck size={14} />
                  ) : (
                    <IconCopy size={14} />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{info.name}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Environment
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground capitalize">
                {info.env}
              </p>
              <p className="text-xs text-muted-foreground mt-1">NODE_ENV</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Commit
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">
                  {info.commitShort}
                </code>
                <button
                  onClick={() => copy(info.commit, "commit")}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-card-hover"
                  aria-label="Copy commit"
                >
                  {copied === "commit" ? (
                    <IconCheck size={14} />
                  ) : (
                    <IconCopy size={14} />
                  )}
                </button>
              </div>
              <p
                className="text-xs text-muted-foreground mt-1 truncate"
                title={info.commit}
              >
                {info.commit}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Build Time
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {new Date(info.buildTime).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono text-[11px]">
                {info.buildTime}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Changelog</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Latest entries from <code>docs/changelog.md</code>
            </p>
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-border bg-muted/20 p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {info.changelog || "No changelog available in this deployment."}
            </pre>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">
              How to bump version
            </h3>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-muted-foreground">
              <li>
                Update{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  package.json
                </code>{" "}
                version (e.g. <code>pnpm version patch</code>).
              </li>
              <li>
                Add entry to{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  docs/changelog.md
                </code>
                .
              </li>
              <li>
                Commit + tag:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  git tag v{info.version}
                </code>{" "}
                and push.
              </li>
              <li>
                Build injects <code>GIT_COMMIT</code> + <code>BUILD_TIME</code>{" "}
                via Docker <code>ARG</code>.
              </li>
            </ol>
          </div>
        </>
      ) : null}
    </div>
  );
}
