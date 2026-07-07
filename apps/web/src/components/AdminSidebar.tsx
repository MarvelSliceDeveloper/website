"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  IconBook,
  IconBrandWindows,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconMail,
  IconLogout,
  IconMessages,
  IconUsers,
  IconUsersGroup,
  IconVideo,
  IconCalendar,
  IconChevronDown,
  IconSettings,
  IconMenu2,
  IconX,
  IconFileDescription,
  IconTrash,
  IconBellRinging,
} from "@tabler/icons-react";

import type { NavItem, NavItemChild } from "@/components/shared/SidebarTypes";



// Link for a child nav item under a parent group
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
    const hasFilteringParams =
      searchParams.get("status") || searchParams.get("role");
    if (hasFilteringParams) {
      isQueryActive = false;
    }
  }

  const isChildActive = isPathActive && isQueryActive;

  return (
    <li>
      <Link
        href={child.href}
        className={`group flex items-center gap-2 py-1.5 px-3 text-[13px] font-medium rounded-lg border transition-all duration-150 ${
          isChildActive
            ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-sm"
            : "border-border/60 bg-card text-muted shadow-sm hover:border-border-hover hover:shadow-md hover:text-foreground"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-all duration-150 ${
            isChildActive
              ? "bg-primary scale-125"
              : "bg-muted/40 group-hover:bg-muted"
          }`}
        />
        <span>{child.label}</span>
      </Link>
    </li>
  );
}

// Collapsible nav group with auto-expand for active child
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
    <div className="space-y-1">
      <p
        className={`px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted ${
          collapsed ? "hidden" : "block"
        }`}
      >
        {label}
      </p>
      <ul className={`space-y-1 ${collapsed ? "mx-auto w-fit" : ""}`}>
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
                  // Collapsed sidebar + group item: icon-only button, no dead link
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => toggleGroup(item.label)}
                    className={`w-full flex items-center justify-center px-2 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/[0.08] text-primary shadow-sm"
                        : "border-border/60 bg-card text-muted shadow-sm hover:border-border-hover hover:shadow-md hover:text-foreground"
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-150 select-none text-left cursor-pointer ${
                        isActive
                          ? "border-primary bg-primary/[0.08] text-primary shadow-sm"
                          : "border-border/60 bg-card text-muted shadow-sm hover:border-border-hover hover:shadow-md hover:text-foreground"
                      }`}
                    >
                      <item.icon size={18} stroke={1.8} className="shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white mr-1">
                          {item.badge}
                        </span>
                      )}
                      <IconChevronDown
                        size={16}
                        stroke={1.8}
                        className={`shrink-0 text-muted transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded
                          ? "max-h-64 opacity-100 mt-0.5"
                          : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                    >
                      <ul className="pl-4 ml-5 space-y-0.5">
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
                  className={`flex items-center text-sm font-medium rounded-lg border-2 transition-all duration-150 ${
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-2.5 px-3 py-2.5"
                  } ${
                    isActive
                      ? "border-primary bg-primary/[0.08] text-primary shadow-sm"
                      : "border-border/60 bg-card text-muted shadow-sm hover:border-border-hover hover:shadow-md hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} stroke={1.8} className="shrink-0" />
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
                          : "rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white"
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

// Admin sidebar with collapsible multi-level navigation
export default function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  userRole,
  userName,
  userEmail,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const sidebarItems: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
    ...(isSuperAdmin
      ? [
          // Super Admin: system operations
          ...[
            { label: "Activity Logs", href: "/admin/logs", icon: IconFileDescription as React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> },
            { label: "Trash", href: "/admin/trash", icon: IconTrash as React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> },
            { label: "Announcements", href: "/admin/announcements", icon: IconBellRinging as React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> },
          ],
          {
            label: "Users",
            href: "/admin/users",
            icon: IconUsers,
            children: [
              { label: "All Users", href: "/admin/users" },
              { label: "Students", href: "/admin/users?role=STUDENT" },
              { label: "Instructors", href: "/admin/users?role=INSTRUCTOR" },
              { label: "Admins", href: "/admin/users?role=ADMIN" },
              { label: "Login History", href: "/admin/users/login-history" },
            ],
          },
          {
            label: "Settings",
            href: "/admin/settings",
            icon: IconSettings,
            children: [
              { label: "System Settings", href: "/admin/settings/system" },
              { label: "API Keys", href: "/admin/settings/api-keys" },
              { label: "Permissions", href: "/admin/settings/permissions" },
              { label: "Consent Logs", href: "/admin/consent-logs" },
              { label: "General", href: "/admin/settings" },
            ],
          },
          { label: "Microsoft", href: "/admin/microsoft", icon: IconBrandWindows },
        ]
      : [
          // Admin: platform operations
          {
            label: "Inbox",
            href: "/admin/inbox",
            icon: IconMail,
            children: [
              { label: "Notifications", href: "/admin/inbox" },
              { label: "Send Notification", href: "/admin/notifications/send" },
              { label: "Mentorship Tickets", href: "/admin/inbox/tickets" },
              { label: "Support", href: "/admin/inbox/support" },
              { label: "Messages", href: "/admin/inbox/messages" },
            ],
          },
          {
            label: "Courses",
            href: "/admin/courses",
            icon: IconBook,
            children: [
              { label: "All Courses", href: "/admin/courses" },
              { label: "Create Course", href: "/admin/courses/new" },
              { label: "Drafts", href: "/admin/courses?status=DRAFT" },
              { label: "Published", href: "/admin/courses?status=PUBLISHED" },
              { label: "Archived", href: "/admin/courses?status=ARCHIVED" },
            ],
          },
          {
            label: "Batches",
            href: "/admin/batches",
            icon: IconUsersGroup,
            children: [
              { label: "All Batches", href: "/admin/batches" },
              { label: "Create Batch", href: "/admin/batches/new" },
              { label: "Active", href: "/admin/batches?status=ACTIVE" },
              { label: "Upcoming", href: "/admin/batches?status=UPCOMING" },
              { label: "Completed", href: "/admin/batches?status=COMPLETED" },
            ],
          },
          {
            label: "Sessions",
            href: "/admin/sessions",
            icon: IconVideo,
            children: [
              { label: "All Sessions", href: "/admin/sessions" },
              { label: "Schedule Session", href: "/admin/sessions/new" },
              { label: "Upcoming", href: "/admin/sessions?status=UPCOMING" },
              { label: "Past", href: "/admin/sessions?status=PAST" },
            ],
          },
          { label: "Reports", href: "/admin/reports", icon: IconChartBar },
          {
            label: "Enrollments",
            href: "/admin/enrollments",
            icon: IconClipboardCheck,
            children: [
              { label: "Pending Requests", href: "/admin/enrollments" },
              { label: "Approved", href: "/admin/enrollments?status=APPROVED" },
              { label: "Rejected", href: "/admin/enrollments?status=REJECTED" },
            ],
          },
          { label: "Calendar", href: "/admin/calendar", icon: IconCalendar },
          {
            label: "Users",
            href: "/admin/users",
            icon: IconUsers,
            children: [
              { label: "All Users", href: "/admin/users" },
              { label: "Students", href: "/admin/users?role=STUDENT" },
              { label: "Instructors", href: "/admin/users?role=INSTRUCTOR" },
              { label: "Admins", href: "/admin/users?role=ADMIN" },
            ],
          },
          {
            label: "Mentorship",
            href: "/admin/mentorship",
            icon: IconMessages,
            children: [
              { label: "All Requests", href: "/admin/mentorship?status=all" },
              { label: "Pending Review", href: "/admin/mentorship?status=OPEN" },
              { label: "Assigned", href: "/admin/mentorship?status=ASSIGNED" },
              { label: "Scheduled", href: "/admin/mentorship?status=SCHEDULED" },
              { label: "Completed", href: "/admin/mentorship?status=COMPLETED" },
            ],
          },
          { label: "Microsoft", href: "/admin/microsoft", icon: IconBrandWindows },
          {
            label: "Settings",
            href: "/admin/settings",
            icon: IconSettings,
            children: [
              { label: "General", href: "/admin/settings" },
            ],
          },
        ]),
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "gap-2 px-4"
        }`}
      >
        <div
          className={`flex items-center gap-2 min-w-0 flex-1 ${collapsed ? "hidden" : "block"}`}
        >
          <img
            src="/images/logo.svg"
            alt="LMS Logo"
            className="h-9 w-auto object-contain"
          />
          <span className="text-base font-bold text-foreground">
            Marvel Slice
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <IconMenu2 size={16} /> : <IconX size={14} />}
        </button>
      </div>

      <nav
        className={`flex-1 overflow-y-auto py-3 ${
          collapsed ? "space-y-4 px-2" : "space-y-4 px-3"
        }`}
      >
        <NavGroup
          label="Overview"
          items={sidebarItems}
          pathname={pathname}
          collapsed={collapsed}
        />
      </nav>

      <div className="border-t border-border p-3 space-y-1.5">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-2.5 px-2 py-2"
          }`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-primary">
            AD
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-sm font-medium text-foreground">
              {userName || "Admin"}
            </p>
            <p className="truncate text-xs text-muted">{userEmail || ""}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await api.post("/api/auth/logout");
            router.push("/login");
          }}
          className="btn-danger w-full justify-center"
        >
          <IconLogout size={15} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
