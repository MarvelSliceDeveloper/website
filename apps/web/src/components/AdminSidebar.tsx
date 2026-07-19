"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import {
  IconBook,
  IconBrandWindows,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconMail,
  IconLogout,
  IconMessages,
  IconPackage,
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
  IconUserCheck,
  IconBellRinging,
  IconServer,
} from "@tabler/icons-react";

import type { NavItem, NavItemChild } from "@/components/shared/SidebarTypes";

// Small count badge, e.g. "3" or "9+". Renders nothing if count is falsy.
function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none min-w-[16px] text-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// Readable, high-contrast child menu link
function ChildNavLink({
  child,
  pathname,
  unreadCounts,
}: {
  child: NavItemChild;
  pathname: string;
  unreadCounts: Record<string, number>;
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
  const childCount = child.unreadKey
    ? unreadCounts[child.unreadKey]
    : undefined;

  return (
    <li>
      <Link
        href={child.href}
        className={`group flex items-center gap-2.5 py-2 pl-9 pr-4 text-[13px] transition-all border-l-3 ${
          isChildActive
            ? "border-primary bg-primary/8 text-primary font-bold"
            : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-transform ${
            isChildActive
              ? "bg-primary scale-125 shadow-sm shadow-primary/40"
              : "bg-slate-400/40 dark:bg-slate-600 group-hover:bg-slate-500"
          }`}
        />
        <span className="flex-1">{child.label}</span>
        <UnreadBadge count={childCount} />
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
  unreadCounts,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed?: boolean;
  unreadCounts: Record<string, number>;
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
        className={`px-4 py-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-border/40 ${
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

          // Unread count for this item. If the item has children with their
          // own unreadKeys, fall back to summing them so the parent badge
          // reflects the total even before it's expanded.
          const ownCount = item.unreadKey
            ? unreadCounts[item.unreadKey]
            : undefined;
          const childrenTotal = item.children?.reduce((sum, child) => {
            return (
              sum + (child.unreadKey ? unreadCounts[child.unreadKey] || 0 : 0)
            );
          }, 0);
          const itemCount = ownCount ?? (childrenTotal || undefined);

          return (
            <li key={item.label} className="space-y-0.5">
              {hasChildren ? (
                collapsed ? (
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => toggleGroup(item.label)}
                    className={`relative w-full flex items-center justify-center p-3 text-sm transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary border-r-3 border-primary"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <item.icon size={18} stroke={1.8} className="shrink-0" />
                    {!!itemCount && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    )}
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
                      <item.icon
                        size={18}
                        stroke={1.8}
                        className="shrink-0 opacity-80"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary mr-1">
                          {item.badge}
                        </span>
                      )}
                      <UnreadBadge count={itemCount} />
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
                            unreadCounts={unreadCounts}
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
                  className={`relative flex items-center text-[13.5px] font-semibold transition-colors ${
                    collapsed
                      ? "justify-center p-3"
                      : "gap-3 px-4 py-2.5 border-l-3"
                  } ${
                    isActive
                      ? "border-primary bg-primary/8 text-primary font-bold"
                      : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <item.icon
                    size={18}
                    stroke={1.8}
                    className="shrink-0 opacity-80"
                  />
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
                  {collapsed ? (
                    !!itemCount && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                    )
                  ) : (
                    <UnreadBadge count={itemCount} />
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

// Main Sidebar Component
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
  const unreadCounts = useUnreadCounts();

  const sidebarItems: NavItem[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: IconLayoutDashboard },
    ...(isSuperAdmin
      ? [
          // Super Admin: system operations
          ...[
            {
              label: "Activity Logs",
              href: "/admin/logs",
              icon: IconFileDescription as React.ComponentType<{
                size?: number | string;
                stroke?: number | string;
                className?: string;
              }>,
            },
            {
              label: "Trash",
              href: "/admin/trash",
              icon: IconTrash as React.ComponentType<{
                size?: number | string;
                stroke?: number | string;
                className?: string;
              }>,
            },
          {
            label: "Announcements",
            href: "/admin/announcements",
            icon: IconBellRinging as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
          },
          {
            label: "Content",
            href: "/admin/categories",
            icon: IconBook as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
            children: [
              { label: "Categories", href: "/admin/categories" },
              { label: "Tags", href: "/admin/tags" },
              { label: "Static Pages", href: "/admin/static-pages" },
              { label: "Certificates", href: "/admin/certificates" },
            ],
          },
          {
            label: "Audit Logs",
            href: "/admin/audit-logs",
            icon: IconFileDescription as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
          },
          ],
          {
            label: "Approvals",
            href: "/admin/approvals",
            icon: IconUserCheck as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
          },
          {
            label: "Users",
            href: "/admin/users",
            icon: IconUsers,
            children: [
              { label: "Login History", href: "/admin/users/login-history" },
              { label: "All Users", href: "/admin/users" },
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
          {
            label: "System",
            href: "/admin/cache",
            icon: IconServer as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
            children: [
              { label: "Cache", href: "/admin/cache" },
              { label: "Email Templates", href: "/admin/email-templates" },
              { label: "Branding", href: "/admin/branding" },
              { label: "i18n", href: "/admin/i18n" },
            ],
          },
          {
            label: "Microsoft",
            href: "/admin/microsoft",
            icon: IconBrandWindows,
          },
          {
            label: "Health",
            href: "/admin/health",
            icon: IconServer as React.ComponentType<{
              size?: number | string;
              stroke?: number | string;
              className?: string;
            }>,
          },
        ]
      : [
          // Admin: platform operations
          {
            label: "Inbox",
            href: "/admin/inbox",
            icon: IconMail,
            unreadKey: "inbox",
            children: [
              {
                label: "Notifications",
                href: "/admin/inbox",
                unreadKey: "notifications",
              },
              { label: "Send Notification", href: "/admin/notifications/send" },
              {
                label: "Mentorship Tickets",
                href: "/admin/inbox/tickets",
                unreadKey: "tickets",
              },
              { label: "Support", href: "/admin/inbox/support" },
              {
                label: "Messages",
                href: "/admin/inbox/messages",
                unreadKey: "messages",
              },
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
            label: "Packages",
            href: "/admin/packages",
            icon: IconPackage,
            children: [
              { label: "All Packages", href: "/admin/packages" },
              { label: "Create Package", href: "/admin/packages/new" },
              {
                label: "Pending Enrollments",
                href: "/admin/packages/enrollments?status=PENDING",
              },
              {
                label: "Active Packages",
                href: "/admin/packages?status=ACTIVE",
              },
            ],
          },
          { label: "Calendar", href: "/admin/calendar", icon: IconCalendar },
          {
            label: "Users",
            href: "/admin/users",
            icon: IconUsers,
            children: [
              { label: "All Users", href: "/admin/users" },
              { label: "Import Users", href: "/admin/users/import" },
            ],
          },
          { label: "Certificates", href: "/admin/certificates", icon: IconClipboardCheck },
          { label: "Payments", href: "/admin/payments", icon: IconPackage },
          {
            label: "Mentorship",
            href: "/admin/mentorship",
            icon: IconMessages,
            unreadKey: "mentorship",
            children: [
              { label: "All Requests", href: "/admin/mentorship?status=all" },
              {
                label: "Pending Review",
                href: "/admin/mentorship?status=OPEN",
                unreadKey: "mentorship_pending",
              },
              { label: "Assigned", href: "/admin/mentorship?status=ASSIGNED" },
              {
                label: "Scheduled",
                href: "/admin/mentorship?status=SCHEDULED",
              },
              {
                label: "Completed",
                href: "/admin/mentorship?status=COMPLETED",
              },
            ],
          },
          {
            label: "Settings",
            href: "/admin/settings",
            icon: IconSettings,
            children: [{ label: "General", href: "/admin/settings" }],
          },
        ]),
  ];

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
          onClick={() => router.push("/admin/dashboard")}
        >
          <img
            src="/images/logo.svg"
            alt="Marvel Slice"
            className="h-9 w-auto object-contain transition-transform duration-300 hover:scale-105"
          />
          <span
            className={`text-base font-extrabold tracking-tight text-foreground ${collapsed ? "hidden" : "block"}`}
          >
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
          items={sidebarItems}
          pathname={pathname}
          collapsed={collapsed}
          unreadCounts={unreadCounts}
        />
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-border bg-card p-3 space-y-1.5">
        <div
          className={`flex items-center border border-border rounded-lg bg-slate-170 dark:bg-slate-90/5 ${
            collapsed ? "justify-center" : "gap-2.5 px-2 py-1.5"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
            AD
          </div>
          <div className={`min-w-0 ${collapsed ? "hidden" : "block"}`}>
            <p className="truncate text-xs font-semibold text-foreground">
              {userName || "Admin"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {userEmail || ""}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await api.post("/api/auth/logout");
            router.push("/login");
          }}
          className="btn-danger w-full justify-center py-2 text-xs font-semibold"
        >
          <IconLogout size={15} stroke={1.8} className="shrink-0" />
          <span className={collapsed ? "hidden" : "inline"}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
