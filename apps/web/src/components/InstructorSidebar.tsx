"use client";

import Link from "next/navigation";
import LinkNext from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import {
  IconBook,
  IconCalendar,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLogout,
  IconUsers,
  IconVideo,
  IconMessageCircle,
} from "@tabler/icons-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
};

const mainItems: NavItem[] = [
  { label: "Dashboard", href: "/instructor/dashboard", icon: IconLayoutDashboard },
  { label: "My Sessions", href: "/instructor/sessions", icon: IconVideo },
  { label: "My Batches", href: "/instructor/batches", icon: IconUsers },
];

export default function InstructorSidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // ignore
    }
    router.push("/login");
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-4"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">
          IN
        </div>
        <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
          <p className="truncate text-sm font-semibold text-foreground">LMS Portal</p>
          <p className="text-xs text-muted">Instructor Area</p>
        </div>
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <IconLayoutSidebarLeftCollapse size={16} stroke={1.8} />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? "space-y-4 px-2" : "space-y-5 px-3"}`}>
        <div className="space-y-1">
          <p className={`px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted ${collapsed ? "hidden" : "block"}`}>
            Menu
          </p>
          <ul className={`space-y-0.5 ${collapsed ? "mx-auto w-fit" : ""}`}>
            {mainItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <LinkNext
                    href={item.href}
                    title={item.label}
                    className={`flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"} ${isActive
                      ? "border border-violet-500/25 bg-violet-500/15 text-violet-400 font-semibold"
                      : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                      }`}
                  >
                    <item.icon size={18} stroke={1.8} className="shrink-0 text-center" />
                    <span className={`truncate ${collapsed ? "hidden" : "inline"}`}>{item.label}</span>
                  </LinkNext>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className={`panel flex items-center ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-400">
            IN
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-medium text-foreground">Instructor Panel</p>
            <p className="truncate text-xs text-muted-foreground">instructor@lms.local</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-secondary mt-2 w-full justify-center border-danger/30 text-danger hover:bg-danger/10"
          aria-label="Sign out"
        >
          <IconLogout size={18} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
