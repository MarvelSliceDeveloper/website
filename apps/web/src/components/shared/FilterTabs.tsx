import type { ReactNode } from "react";

export interface FilterTab {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterTabs({
  tabs,
  active,
  onChange,
  className = "",
}: FilterTabsProps) {
  return (
    <div className={`flex gap-1.5 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            active === tab.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-card-hover"
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-0.5 text-[11px] opacity-70">· {tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
