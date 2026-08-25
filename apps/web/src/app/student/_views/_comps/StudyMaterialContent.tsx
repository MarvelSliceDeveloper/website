"use client";

import { IconFile, IconFileDownload, IconEye } from "@tabler/icons-react";

interface StudyMaterialContentProps {
  name: string;
  url: string;
}

export default function StudyMaterialContent({
  name,
  url,
}: StudyMaterialContentProps) {
  return (
    <div className="space-y-4">
      <div className="w-full rounded-xl overflow-hidden border border-border bg-card">
        <iframe
          src={url}
          title={name}
          className="w-full h-[calc(100vh-var(--shell-header-height,56px)-200px)]"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <IconFile size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Study Material
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="View in new tab"
          >
            <IconEye size={14} />
            View
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Download"
          >
            <IconFileDownload size={14} />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
