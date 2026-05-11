"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; icon: string };

const learnItems: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: "ti-layout-dashboard" },
  { label: "Courses", href: "/student/courses", icon: "ti-book" },
  { label: "Live Sessions", href: "/student/sessions", icon: "ti-video" },
];

const growthItems: NavItem[] = [
  { label: "1-on-1 Mentorship", href: "/student/mentorship", icon: "ti-users" },
  { label: "Calendar", href: "/student/calendar", icon: "ti-calendar" },
  { label: "Certificates", href: "/student/certificates", icon: "ti-certificate" },
];

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "border border-primary/25 bg-primary/15 text-primary-hover"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  }`}
              >
                <i className={`ti ${item.icon} w-5 shrink-0 text-[17px] text-center`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          LM
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">LMS Portal</p>
          <p className="text-xs text-muted">Student Area</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <NavGroup label="Learn" items={learnItems} pathname={pathname} />
        <NavGroup label="Growth" items={growthItems} pathname={pathname} />
      </nav>

      <div className="border-t border-border p-3">
        <div className="panel flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
            ST
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Student Demo</p>
            <p className="truncate text-xs text-muted-foreground">student@lms.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
