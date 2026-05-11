"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
};

const mainNavItems: NavItem[] = [
  { label: "Mentorship", href: "/admin/mentorship", icon: "ti-users", badge: 3 },
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
                <i
                  className={`ti ${item.icon} text-[18px] shrink-0`}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          AD
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">LMS Portal</p>
          <p className="text-xs text-muted">Admin Console</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary-hover">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <NavGroup label="Main" items={mainNavItems} pathname={pathname} />
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <div className="panel flex items-center gap-3 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
            AD
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Admin Demo</p>
            <p className="truncate text-xs text-muted-foreground">admin@lms.local</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="btn-secondary w-full justify-center border-danger/30 text-danger hover:bg-danger/10"
        >
          <i className="ti ti-logout text-[18px] shrink-0" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
