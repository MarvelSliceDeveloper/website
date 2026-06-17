interface StatusBadgeProps {
  status: string;
  config: Record<string, { label: string; classes: string }>;
}

export function StatusBadge({ status, config }: StatusBadgeProps) {
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.classes}`}>
      {c.label}
    </span>
  );
}
