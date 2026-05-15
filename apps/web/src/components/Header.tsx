"use client";

import { useRef } from "react";
import {
  IconBell,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightExpand,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";

export default function Header({
  isSidebarCollapsed = false,
  onToggleSidebar = () => { },
}: {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {isSidebarCollapsed ? (
              <IconLayoutSidebarRightExpand size={18} stroke={1.8} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.8} />
            )}
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">LMS Workspace</p>
            <h2 className="text-sm font-semibold text-foreground md:text-base">Welcome back 👋</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:flex h-9 w-60 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <IconSearch size={16} stroke={1.8} className="text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
            />
            <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted">Ctrl K</kbd>
          </div>

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Notifications"
          >
            <IconBell size={18} stroke={1.8} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
              3
            </span>
          </button>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Settings"
          >
            <IconSettings size={18} stroke={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
