"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  IconLayoutDashboard,
  IconLogout,
  IconSend,
  IconUsers,
  IconVideo,
  IconMail,
  IconMessageCircle,
  IconChevronDown,
  IconHelp,
  IconSettings,
  IconMenu2,
  IconX,
  IconBook,
} from "@tabler/icons-react";

import type { NavItem, NavItemChild } from "@/components/shared/SidebarTypes";

const overviewItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/instructor/dashboard",
    icon: IconLayoutDashboard,
  },
  { label: "Inbox", href: "/instructor/inbox", icon: IconMail },
  {
    label: "Send Notification",
    href: "/instructor/notifications/send",
    icon: IconSend,
  },
  {
    label: "My Sessions",
    href: "/instructor/sessions",
    icon: IconVideo,
    children: [
      { label: "All Sessions", href: "/instructor/sessions" },
      { label: "Upcoming", href: "/instructor/sessions?status=UPCOMING" },
      { label: "Past", href: "/instructor/sessions?status=PAST" },
    ],
  },
  {
    label: "My Batches",
    href: "/instructor/batches",
    icon: IconUsers,
    children: [
      { label: "All Batches", href: "/instructor/batches" },
      { label: "Active", href: "/instructor/batches?status=ACTIVE" },
      { label: "Completed", href: "/instructor/batches?status=COMPLETED" },
    ],
  },
  {
    label: "My Courses",
    href: "/instructor/courses",
    icon: IconBook,
    children: [{ label: "All Courses", href: "/instructor/courses" }],
  },
  {
    label: "Mentorship",
    href: "/instructor/mentorship",
    icon: IconMessageCircle,
    children: [
      { label: "All Requests", href: "/instructor/mentorship" },
      { label: "Pending", href: "/instructor/mentorship?status=OPEN" },
      { label: "Scheduled", href: "/instructor/mentorship?status=SCHEDULED" },
      { label: "Completed", href: "/instructor/mentorship?status=COMPLETED" },
    ],
  },
  { label: "Support", href: "/instructor/support", icon: IconHelp },
  { label: "Settings", href: "/instructor/settings", icon: IconSettings },
];

// Readable, high-contrast child menu link
function ChildNavLink({
  child,
  pathname,
}: {
  child: NavItemChild;
  pathname: string;
}) {
  const searchParams = useSearchParams();

  const [childPath, childQueryString] = child.href.split("?");
  const isPathActive = pathname === childPath;

  let isQueryActive = true;
  if (childQueryString) {
    const childParams = new URLSearchParams(childQueryString);
    childParams.forEach((value, key) => {
      if (searchParams.get(key) !== value) {
        isQueryActive = false;
      }
    });
  } else {
    const hasFilteringParams = searchParams.get("status");
    if (hasFilteringParams) {
      isQueryActive = false;
    }
  }

  const isChildActive = isPathActive && isQueryActive;

  return (
    <li>
      <Link
        href={child.href}
        className={`group flex items-center gap-2.5 py-2 pl-9 pr-4 text-[13px] transition-all border-l-3 ${
          isChildActive
            ? "border-primary bg-primary/8 text-primary font-bold"
            : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-transform ${
            isChildActive
              ? "bg-primary scale-125 shadow-sm shadow-primary/40"
              : "bg-slate-400/40 dark:bg-slate-600 group-hover:bg-slate-500"
          }`}
        />
        <span>{child.label}</span>
      </Link>
    </li>
  );
}

// Collapsible navigation group for sidebar
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [manuallyCollapsed, setManuallyCollapsed] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (collapsed) return;
    const activeGroup = items.find((item) => {
      if (!item.children) return false;
      return item.children.some((child) => {
        const [childPath] = child.href.split("?");
        return pathname === childPath;
      });
    });
    if (activeGroup && manuallyCollapsed !== activeGroup.label) {
      Promise.resolve().then(() => setExpandedGroup(activeGroup.label));
    } else if (!activeGroup && manuallyCollapsed === null) {
      Promise.resolve().then(() => setExpandedGroup(null));
    }
  }, [pathname, collapsed, items, manuallyCollapsed]);

  const toggleGroup = (groupLabel: string) => {
    const isOpening = expandedGroup !== groupLabel;
    setManuallyCollapsed(isOpening ? null : groupLabel);
    setExpandedGroup(isOpening ? groupLabel : null);
  };

  return (
    <div className="space-y-1.5">
      <p
        className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-border/40 ${
          collapsed ? "hidden" : "block"
        }`}
      >
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedGroup === item.label;
          const isParentActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const isAnyChildActive =
            hasChildren &&
            item.children!.some((child) => {
              const [childPath] = child.href.split("?");
              return pathname === childPath;
            });
          const isActive = isParentActive || isAnyChildActive;

          return (
            <li key={item.label} className="space-y-0.5">
              {hasChildren ? (
                collapsed ? (
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-center p-3 text-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary border-r-3 border-primary"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <item.icon size={18} stroke={1.8} className="shrink-0" />
                  </button>
                ) : (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.label)}
                      title={item.label}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-semibold transition-colors select-none text-left cursor-pointer border-l-3 ${
                        isActive
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <item.icon size={18} stroke={1.8} className="shrink-0 opacity-80" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary mr-1">
                          {item.badge}
                        </span>
                      )}
                      <IconChevronDown
                        size={15}
                        stroke={1.8}
                        className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? "max-h-64 opacity-100"
                          : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                    >
                      <ul className="space-y-0.5 bg-slate-500/[0.03] border-l border-border/60 ml-6">
                        {item.children!.map((child) => (
                          <ChildNavLink
                            key={child.href}
                            child={child}
                            pathname={pathname}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              ) : (
                <Link
                  href={item.href}
                  title={item.label}
                  className={`flex items-center text-[13.5px] font-semibold transition-colors ${
                    collapsed
                      ? "justify-center p-3"
                      : "gap-3 px-4 py-2.5 border-l-3"
                  } ${
                    isActive
                      ? "border-primary bg-primary/8 text-primary font-bold"
                      : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <item.icon size={18} stroke={1.8} className="shrink-0 opacity-80" />
                  <span
                    className={`flex-1 truncate ${collapsed ? "hidden" : "block"}`}
                  >
                    {item.label}
                  </span>
                  {item.badge != null && (
                    <span
                      className={`${
                        collapsed
                          ? "hidden"
                          : "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Instructor sidebar with nav groups and sign-out
export default function InstructorSidebar({
  collapsed = false,
  onToggleCollapse,
  userName,
  userEmail,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Log out the user and redirect to login
  async function handleSignOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ignore
    }
    router.push("/login");
  }

  // Get initials for profile picture
  const displayInitials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "IN";

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div
        className={`flex h-14 items-center border-b border-border bg-card ${
          collapsed ? "justify-center px-2" : "gap-2.5 px-4"
        }`}
      >
        <div
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
          onClick={() => router.push("/instructor/dashboard")}
        >
          <img
            src="/images/logo.svg"
            alt="Marvel Slice"
            className="h-9 w-auto object-contain transition-transform duration-300 hover:scale-105"
          />
          <span className={`text-base font-extrabold tracking-tight text-foreground ${collapsed ? "hidden" : "block"}`}>
            <span>Marvel</span>
            <span className="text-primary ml-0.5">Slice</span>
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-muted hover:text-foreground hover:bg-muted/15 transition-colors rounded-lg"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <IconMenu2 size={16} /> : <IconX size={14} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        <NavGroup
          label="Overview"
          items={overviewItems}
          pathname={pathname}
          collapsed={collapsed}
        />
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-border bg-card p-3 space-y-1.5">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-2.5 px-2 py-1.5"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
            {displayInitials}
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-xs font-semibold text-foreground">
              {userName || "Instructor"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{userEmail || ""}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-danger w-full justify-center py-2 text-xs font-semibold"
        >
          <IconLogout size={15} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
