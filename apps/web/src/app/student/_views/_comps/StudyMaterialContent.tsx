"use client";

import { IconFile } from "@tabler/icons-react";

interface StudyMaterialContentProps {
  name: string;
  url: string;
  onBack: () => void;
}

export default function StudyMaterialContent({
  name,
  url,
  onBack,
}: StudyMaterialContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconFile size={18} className="text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>
      <div className="w-full rounded-xl overflow-hidden border border-border bg-card">
        <iframe
          src={url}
          title={name}
          className="w-full h-[calc(100vh-var(--shell-header-height,56px)-200px)]"
        />
      </div>
    </div>
  );
}
