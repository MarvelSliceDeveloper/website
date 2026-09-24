"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import {
  IconBook,
  IconChartBar,
  IconClipboardCheck,
  IconLayoutDashboard,
  IconMail,
  IconPackage,
  IconUsers,
  IconUsersGroup,
  IconVideo,
  IconCalendar,
  IconChevronDown,
  IconSettings,
  IconFileDescription,
  IconTrash,
  IconUserCheck,
  IconBellRinging,
  IconServer,
  IconShield,
  IconRefresh,
  IconAlarmSmoke,
  IconHeartHandshake,
  IconUserShare,
  IconSparkles,
  IconTag,
  IconX,
} from "@tabler/icons-react";

import type { NavItem, NavItemChild } from "@/components/shared/SidebarTypes";
import {
  getNavIconClass,
  getNavItemColors,
} from "@/components/shared/sidebarNav";

// Small count badge, e.g. "3" or "9+". Renders nothing if count is falsy.
function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none min-w-[16px] text-center shrink-0">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// Readable, high-contrast child menu link
function ChildNavLink({
  child,
  pathname,
  unreadCounts,
  onItemClick,
}: {
  child: NavItemChild;
  pathname: string;
  unreadCounts: Record<string, number>;
  onItemClick?: () => void;
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
        onClick={onItemClick}
        className={`group flex items-center gap-2.5 py-2 pl-9 pr-4 text-[13px] transition-all border-l-3 ${getNavItemColors(isChildActive)}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-transform ${
            isChildActive
              ? "bg-primary scale-125 shadow-sm shadow-primary/40"
              : "bg-slate-500 group-hover:bg-primary"
          }`}
        />
        <span className="flex-1 truncate">{child.label}</span>
        <UnreadBadge count={childCount} />
      </Link>
    </li>
  );
}

const SECTION_ACCENTS: Record<string, { dot: string; text: string }> = {
  "Academic & Learning": {
    dot: "bg-blue-500 shadow-xs shadow-blue-500/50",
    text: "text-blue-600 dark:text-blue-400",
  },
  "Users & Community": {
    dot: "bg-emerald-500 shadow-xs shadow-emerald-500/50",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  "Monetization & Growth": {
    dot: "bg-amber-500 shadow-xs shadow-amber-500/50",
    text: "text-amber-600 dark:text-amber-400",
  },
  "Platform & Governance": {
    dot: "bg-indigo-500 shadow-xs shadow-indigo-500/50",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

// Collapsible navigation group for sidebar
function NavGroup({
  label,
  items,
  pathname,
  collapsed = false,
  unreadCounts,
  onItemClick,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  collapsed?: boolean;
  unreadCounts: Record<string, number>;
  onItemClick?: () => void;
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
      <div
        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4b5563] ${
          collapsed ? "hidden" : "flex"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
            SECTION_ACCENTS[label]?.dot || "bg-primary"
          }`}
          aria-hidden="true"
        />
        <span className="truncate">{label}</span>
      </div>
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

          const ownCount = item.unreadKey
            ? unreadCounts[item.unreadKey]
            : undefined;
          const childrenTotal = item.children?.reduce((sum, child) => {
            return (
              sum + (child.unreadKey ? unreadCounts[child.unreadKey] || 0 : 0)
            );
          }, 0);
          const itemCount = ownCount ?? (childrenTotal || undefined);

          const navItemColors = getNavItemColors(isActive);

          return (
            <li key={item.label} className="space-y-0.5">
              {hasChildren ? (
                collapsed ? (
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => toggleGroup(item.label)}
                    className={`relative w-full flex items-center justify-center p-3 text-[13.5px] font-semibold transition-colors cursor-pointer border-l-3 ${navItemColors}`}
                  >
                    <item.icon
                      size={18}
                      stroke={1.8}
                      className={getNavIconClass(isActive)}
                    />
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
                      className={`w-full flex items-center gap-3 px-4 py-2 text-[13.5px] font-semibold transition-colors select-none text-left cursor-pointer border-l-3 ${navItemColors}`}
                    >
                      <item.icon
                        size={18}
                        stroke={1.8}
                        className={getNavIconClass(isActive)}
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
                        className={`shrink-0 text-[#4b5563] transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? "max-h-80 opacity-100"
                          : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                    >
                      <ul className="space-y-0.5 bg-slate-500/[0.03] border-l border-border/60 ml-6">
                        {item.children!.map((child) => (
                          <ChildNavLink
                            key={`${child.href}-${child.label}`}
                            child={child}
                            pathname={pathname}
                            unreadCounts={unreadCounts}
                            onItemClick={onItemClick}
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
                  onClick={onItemClick}
                  className={`relative flex items-center text-[13.5px] font-semibold transition-colors ${
                    collapsed
                      ? "justify-center p-3"
                      : "gap-3 px-4 py-2 border-l-3"
                  } ${navItemColors}`}
                >
                  <item.icon
                    size={18}
                    stroke={1.8}
                    className={getNavIconClass(isActive)}
                  />
                  <span
                    className={`flex-1 truncate ${
                      collapsed ? "hidden" : "block"
                    }`}
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
  mobileOpen = false,
  onCloseMobile,
  userRole,
  userName: _userName,
  userEmail: _userEmail,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const unreadCounts = useUnreadCounts();

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // ─── 4 Streamlined Navigation Hubs ──────────────────────────────────────────
  const sidebarItems = [
    // 1. Academic & Learning Hub
    {
      label: "Academic & Learning",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: IconLayoutDashboard,
        },
        {
          label: "Courses",
          href: "/admin/courses",
          icon: IconBook,
          children: [
            { label: "All Courses", href: "/admin/courses" },
            { label: "Create Course", href: "/admin/courses/new" },
            ...(isSuperAdmin
              ? [
                  { label: "Categories", href: "/admin/categories" },
                  { label: "Tags", href: "/admin/tags" },
                ]
              : []),
          ],
        },
        {
          label: "Batches",
          href: "/admin/batches",
          icon: IconUsersGroup,
          children: [
            { label: "All Batches", href: "/admin/batches" },
            { label: "Create Batch", href: "/admin/batches/new" },
          ],
        },
        {
          label: "Live Sessions",
          href: "/admin/sessions",
          icon: IconVideo,
          children: [
            { label: "Scheduled Sessions", href: "/admin/sessions" },
            { label: "Schedule Session", href: "/admin/sessions/new" },
            ...(isSuperAdmin
              ? [
                  {
                    label: "Active Sessions",
                    href: "/admin/session-management",
                  },
                ]
              : []),
            {
              label: "Upcoming Sessions",
              href: "/admin/sessions?status=UPCOMING",
            },
            { label: "Past Sessions", href: "/admin/sessions?status=PAST" },
          ],
        },
        {
          label: "Assignments",
          href: "/admin/assignments/review",
          icon: IconClipboardCheck,
        },
        {
          label: "Calendar",
          href: "/admin/calendar",
          icon: IconCalendar,
        },
      ],
    },

    // 2. Users & Community Hub
    {
      label: "Users & Community",
      items: [
        {
          label: "Users",
          href: "/admin/users",
          icon: IconUsers,
          children: [
            { label: "Students", href: "/admin/users" },
            { label: "Instructors", href: "/admin/instructors" },
            ...(isSuperAdmin
              ? [
                  {
                    label: "Login History",
                    href: "/admin/users/login-history",
                  },
                ]
              : []),
            ...(isSuperAdmin
              ? [
                  {
                    label: "Pending Approvals",
                    href: "/admin/users/pending",
                  },
                ]
              : []),
          ],
        },
        {
          label: "Interns",
          href: "/admin/interns",
          icon: IconUserCheck,
          children: [
            { label: "Manage Interns", href: "/admin/interns" },
            { label: "Schedule Class", href: "/admin/interns/schedule" },
            {
              label: "Assignment Tracker",
              href: "/admin/interns/assignments",
            },
          ],
        },
        {
          label: "Mentorship",
          href: "/admin/mentorship",
          icon: IconHeartHandshake,
          unreadKey: "mentorship",
        },
        {
          label: "Communication",
          href: "/admin/inbox",
          icon: IconMail,
          unreadKey: "inbox",
          children: [
            {
              label: "Inbox Notifications",
              href: "/admin/inbox",
              unreadKey: "notifications",
            },
            {
              label: "Send Notification",
              href: "/admin/notifications/send",
            },
            ...(isSuperAdmin
              ? [
                  {
                    label: "Announcements",
                    href: "/admin/announcements",
                  },
                ]
              : []),
            { label: "Support Tickets", href: "/admin/inbox/support" },
          ],
        },
      ],
    },

    // 3. Monetization & Growth Hub
    {
      label: "Monetization & Growth",
      items: [
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
        {
          label: "Payments",
          href: "/admin/payments",
          icon: IconPackage,
        },
        {
          label: "Approvals & Refunds",
          href: "/admin/refunds",
          icon: IconRefresh,
          children: [
            { label: "Refunds", href: "/admin/refunds" },
            ...(isSuperAdmin
              ? [
                  {
                    label: "Refund Approvals",
                    href: "/admin/refunds/approvals",
                  },
                ]
              : []),
            { label: "Approvals", href: "/admin/approvals" },
          ],
        },
        ...(isSuperAdmin
          ? [
              {
                label: "Coupons & Discounts",
                href: "/admin/coupons",
                icon: IconClipboardCheck,
              },
            ]
          : []),
        {
          label: "Referrals",
          href: "/admin/referrals",
          icon: IconUserShare,
        },
        {
          label: "Certificates",
          href: "/admin/certificates",
          icon: IconClipboardCheck,
        },
        {
          label: "Reports & Analytics",
          href: "/admin/reports",
          icon: IconChartBar,
          children: [
            { label: "Analytics Overview", href: "/admin/reports" },
            { label: "Course Report", href: "/admin/reports/course" },
            { label: "Payment Report", href: "/admin/reports/payment" },
          ],
        },
      ],
    },

    // 4. Platform & Governance Hub
    {
      label: "Platform & Governance",
      items: isSuperAdmin
        ? [
            {
              label: "Settings",
              href: "/admin/settings",
              icon: IconSettings,
              children: [
                { label: "General Settings", href: "/admin/settings" },
                {
                  label: "System Settings",
                  href: "/admin/settings/system",
                },
                { label: "API Keys", href: "/admin/settings/api-keys" },
                {
                  label: "Permissions",
                  href: "/admin/settings/permissions",
                },
                {
                  label: "Backup & Restore",
                  href: "/admin/settings/backup",
                },
                {
                  label: "Alerting Webhooks",
                  href: "/admin/settings/webhooks",
                },
              ],
            },
            {
              label: "Logs & Audit",
              href: "/admin/logs",
              icon: IconFileDescription,
              children: [
                { label: "Activity Logs", href: "/admin/logs" },
                { label: "Audit Logs", href: "/admin/audit-logs" },
                { label: "Consent Logs", href: "/admin/consent-logs" },
              ],
            },
            {
              label: "System Health & Cache",
              href: "/admin/health",
              icon: IconServer,
              children: [
                { label: "System Health", href: "/admin/health" },
                { label: "Cache Management", href: "/admin/cache" },
              ],
            },
            {
              label: "AI Integration",
              href: "/admin/settings/ai",
              icon: IconSparkles,
            },
            {
              label: "Maintenance & Trash",
              href: "/admin/maintenance",
              icon: IconAlarmSmoke,
              children: [
                {
                  label: "Maintenance Mode",
                  href: "/admin/maintenance",
                },
                { label: "Recycle Bin", href: "/admin/trash" },
                { label: "Version Info", href: "/admin/version" },
              ],
            },
            {
              label: "Email & Localization",
              href: "/admin/email-templates",
              icon: IconMail,
              children: [
                {
                  label: "Email Templates",
                  href: "/admin/email-templates",
                },
                { label: "i18n Locales", href: "/admin/i18n" },
              ],
            },
          ]
        : [
            {
              label: "Settings",
              href: "/admin/settings",
              icon: IconSettings,
              children: [
                { label: "General Settings", href: "/admin/settings" },
                {
                  label: "Email Templates",
                  href: "/admin/email-templates",
                },
              ],
            },
          ],
    },
  ];

  return (
    <>
      {/* ─── Mobile Slide-Over Drawer Backdrop ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* ─── Mobile Slide-Over Drawer Sheet ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-76 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Mobile Admin Navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5 select-none">
            <Image
              src="/images/logo.svg"
              alt="Marvel Slice"
              width={44}
              height={44}
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-black tracking-tight text-foreground flex items-center">
              <span className="text-[#2551d9]">Marvel</span>
              <span className="text-[#f59e0b] ml-1">Slice</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/15 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <IconX size={20} stroke={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {sidebarItems.map((group) => (
            <NavGroup
              key={group.label}
              label={group.label}
              items={group.items}
              pathname={pathname}
              collapsed={false}
              unreadCounts={unreadCounts}
              onItemClick={onCloseMobile}
            />
          ))}
        </nav>
      </aside>

      {/* ─── Desktop Aside Navigation ─── */}
      <aside
        className={`sticky top-16 shrink-0 z-20 hidden h-[calc(100vh-var(--admin-header-height,64px))] flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          {sidebarItems.map((group) => (
            <NavGroup
              key={group.label}
              label={group.label}
              items={group.items}
              pathname={pathname}
              collapsed={collapsed}
              unreadCounts={unreadCounts}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}