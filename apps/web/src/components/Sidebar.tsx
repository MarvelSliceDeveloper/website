"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import {
  IconBook,
  IconCertificate,
  IconCalendar,
  IconLayoutDashboard,
  IconLogout,
  IconUsers,
  IconVideo,
  IconHelp,
} from "@tabler/icons-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
};

const learnItems: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: IconLayoutDashboard },
  { label: "Courses", href: "/student/courses", icon: IconBook },
  { label: "Live Sessions", href: "/student/sessions", icon: IconVideo },
];

const growthItems: NavItem[] = [
  { label: "1-on-1 Mentorship", href: "/student/mentorship", icon: IconUsers },
  { label: "Support", href: "/student/support", icon: IconHelp },
  { label: "Calendar", href: "/student/calendar", icon: IconCalendar },
  { label: "Certificates", href: "/student/certificates", icon: IconCertificate },
];

// Group of navigation links with a section label
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
                <item.icon size={18} stroke={1.8} className="shrink-0 text-center" />
                <span className={`truncate ${collapsed ? "hidden" : "inline"}`}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Student sidebar with nav groups and sign-out
export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Log out the user and redirect to login
  async function handleSignOut() {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // ignore — still redirect
    }
    router.push("/login");
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-4"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          LM
        </div>
        <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
          <p className="truncate text-sm font-semibold text-foreground">LMS Portal</p>
          <p className="text-xs text-muted">Student Area</p>
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? "space-y-4 px-2" : "space-y-5 px-3"}`}>
        <NavGroup label="Learn" items={learnItems} pathname={pathname} collapsed={collapsed} />
        <NavGroup label="Growth" items={growthItems} pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="border-t border-border p-3">
        <div className={`panel flex items-center ${collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary-hover">
            ST
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-medium text-foreground">Student Demo</p>
            <p className="truncate text-xs text-muted-foreground">student@lms.local</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-danger mt-2 w-full justify-center"
          aria-label="Sign out"
        >
          <IconLogout size={18} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
