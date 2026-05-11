"use client";

import { useRef } from "react";

export default function Header() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap md:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">LMS Workspace</p>
          <h2 className="text-sm font-semibold text-foreground md:text-base">Welcome back 👋</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:flex h-9 w-60 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <i className="ti ti-search text-sm text-muted-foreground" aria-hidden="true" />
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
            <i className="ti ti-bell text-base" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
              3
            </span>
          </button>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Settings"
          >
            <i className="ti ti-settings text-base" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
