"use client";

interface StudyMaterialContentProps {
  name: string;
  url: string;
  onBack: () => void;
}

export default function StudyMaterialContent({
  name,
  url,
}: StudyMaterialContentProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border bg-card">
      <iframe
        src={url}
        title={name}
        className="w-full h-[calc(100vh-var(--shell-header-height,56px)-200px)]"
      />
    </div>
  );
}
