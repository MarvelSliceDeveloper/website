"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-xl px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Welcome back 👋</h2>
        <p className="text-xs text-muted">Here&apos;s what&apos;s happening today</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search courses..."
            className="h-9 w-64 rounded-lg border border-border bg-card px-4 pr-8 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">⌘K</span>
        </div>
        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted transition-colors hover:bg-card-hover hover:text-foreground">
          🔔
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white font-bold">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
