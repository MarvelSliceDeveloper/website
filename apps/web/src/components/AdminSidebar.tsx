"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBook,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLogout,
  IconMessages,
  IconUsers,
  IconUsersGroup,
  IconVideo,
} from "@tabler/icons-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
  badge?: number;
};

const overviewItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
  { label: "Courses", href: "/admin/courses", icon: IconBook },
  { label: "Batches", href: "/admin/batches", icon: IconUsersGroup },
  { label: "Sessions", href: "/admin/sessions", icon: IconVideo },
];

const managementItems: NavItem[] = [
  { label: "Users", href: "/admin/users", icon: IconUsers },
  { label: "Mentorship", href: "/admin/mentorship", icon: IconMessages, badge: 3 },
];

function NavGroup({
  label,
  items,
  pathname,
  collapsed = false,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className={`px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted ${collapsed ? "hidden" : "block"}`}>
        {label}
      </p>
      <ul className={`space-y-0.5 ${collapsed ? "mx-auto w-fit" : ""}`}>
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                className={`flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} ${isActive
                    ? "border border-primary/25 bg-primary/15 text-primary-hover"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  }`}
              >
                <item.icon size={18} stroke={1.8} className="shrink-0" />
                <span className={`flex-1 truncate ${collapsed ? "hidden" : "block"}`}>{item.label}</span>
                {item.badge != null && (
                  <span className={`${collapsed ? "hidden" : "rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white"}`}>
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

export default function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-4"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          AD
        </div>
        <div className={`min-w-0 flex-1 ${collapsed ? "hidden" : "block"}`}>
          <p className="truncate text-sm font-semibold text-foreground">LMS Portal</p>
          <p className="text-xs text-muted">Admin Console</p>
        </div>
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Collapse admin sidebar"
          >
            <IconLayoutSidebarLeftCollapse size={16} stroke={1.8} />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? "space-y-4 px-2" : "space-y-5 px-3"}`}>
        <NavGroup label="Overview" items={overviewItems} pathname={pathname} collapsed={collapsed} />
        <NavGroup label="Management" items={managementItems} pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <div className={`panel flex items-center ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
            AD
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-medium text-foreground">Admin Demo</p>
            <p className="truncate text-xs text-muted-foreground">admin@lms.local</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="btn-secondary w-full justify-center border-danger/30 text-danger hover:bg-danger/10"
        >
          <IconLogout size={18} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
