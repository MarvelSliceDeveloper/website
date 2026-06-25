"use client";

export interface StudentSectionTab {
    key: string;
    label: string;
    badge?: number;
    enabled: boolean;
}

interface StudentSectionTabsProps {
    tabs: StudentSectionTab[];
    activeKey: string;
    onChange: (key: string) => void;
}

// Section tabs with active indicator and optional badges
export default function StudentSectionTabs({ tabs, activeKey, onChange }: StudentSectionTabsProps) {
    const visibleTabs = tabs.filter((tab) => tab.enabled);

    if (visibleTabs.length === 0) return null;

    return (
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-0 scrollbar-none">
            {visibleTabs.map((tab) => {
                const active = activeKey === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                        {typeof tab.badge === "number" ? (
                            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                                {tab.badge}
                            </span>
                        ) : null}
                        {active ? <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" /> : null}
                    </button>
                );
            })}
        </div>
    );
}
