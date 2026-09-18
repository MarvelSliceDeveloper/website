"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import {
  IconLayoutDashboard,
  IconMail,
  IconUsers,
  IconVideo,
  IconMessageCircle,
  IconChevronDown,
  IconHelp,
  IconSettings,
  IconBook,
  IconFileCheck,
  IconUser,
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

const SECTION_ACCENTS: Record<string, { dot: string; text: string }> = {
  Overview: {
    dot: "bg-blue-500 shadow-xs shadow-blue-500/50",
    text: "text-blue-600 dark:text-blue-400",
  },
  Teaching: {
    dot: "bg-emerald-500 shadow-xs shadow-emerald-500/50",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  Communication: {
    dot: "bg-amber-500 shadow-xs shadow-amber-500/50",
    text: "text-amber-600 dark:text-amber-400",
  },
  Account: {
    dot: "bg-indigo-500 shadow-xs shadow-indigo-500/50",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

const overviewItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/instructor/dashboard",
    icon: IconLayoutDashboard,
  },
];

const teachingItems: NavItem[] = [
  {
    label: "My Batches",
    href: "/instructor/batches",
    icon: IconUsers,
    children: [
      { label: "View Batches", href: "/instructor/batches" },
      { label: "Active", href: "/instructor/batches?status=ACTIVE" },
      { label: "Completed", href: "/instructor/batches?status=COMPLETED" },
    ],
  },
  {
    label: "My Courses",
    href: "/instructor/courses",
    icon: IconBook,
    children: [{ label: "View Courses", href: "/instructor/courses" }],
  },
  {
    label: "My Sessions",
    href: "/instructor/sessions",
    icon: IconVideo,
    children: [
      { label: "View Sessions", href: "/instructor/sessions" },
      { label: "Upcoming", href: "/instructor/sessions?status=UPCOMING" },
      { label: "Past", href: "/instructor/sessions?status=PAST" },
    ],
  },
  {
    label: "Assignments",
    href: "/instructor/assignments",
    icon: IconFileCheck,
  },
];

const communicationItems: NavItem[] = [
  {
    label: "Inbox",
    href: "/instructor/inbox",
    icon: IconMail,
    unreadKey: "inbox",
  },
  {
    label: "Mentorship",
    href: "/instructor/mentorship",
    icon: IconMessageCircle,
    unreadKey: "mentorship",
    children: [
      { label: "View Requests", href: "/instructor/mentorship" },
      { label: "Pending", href: "/instructor/mentorship?status=OPEN" },
      { label: "Scheduled", href: "/instructor/mentorship?status=SCHEDULED" },
      { label: "Completed", href: "/instructor/mentorship?status=COMPLETED" },
    ],
  },
];

const accountItems: NavItem[] = [
  {
    label: "My Profile",
    href: "/instructor/settings?tab=profile",
    icon: IconUser,
  },
  { label: "Support", href: "/instructor/support", icon: IconHelp },
];

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
    const hasFilteringParams = searchParams.get("status");
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
        className={`group flex items-center gap-2.5 py-2 pl-9 pr-4 text-[13px] transition-all border-l-3 ${getNavItemColors(
          isChildActive,
        )}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
            isChildActive
              ? "bg-primary scale-125 shadow-xs shadow-primary/50"
              : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary/70 group-hover:scale-110"
          }`}
        />
        <span className="flex-1 truncate">{child.label}</span>
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
        className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
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
                      size={19}
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
                        size={19}
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
                      ? "justify-center p-3 border-l-3"
                      : "gap-3 px-4 py-2 border-l-3"
                  } ${navItemColors}`}
                >
                  <item.icon
                    size={19}
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

// Instructor sidebar with nav groups and mobile drawer
export default function InstructorSidebar({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  userName: _userName,
  userEmail: _userEmail,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const unreadCounts = useUnreadCounts();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Mobile Slide-Over Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer Sheet */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-76 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Mobile Instructor Navigation"
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
          <NavGroup
            label="Overview"
            items={overviewItems}
            pathname={pathname}
            collapsed={false}
            unreadCounts={unreadCounts}
            onItemClick={onCloseMobile}
          />
          <NavGroup
            label="Teaching"
            items={teachingItems}
            pathname={pathname}
            collapsed={false}
            unreadCounts={unreadCounts}
            onItemClick={onCloseMobile}
          />
          <NavGroup
            label="Communication"
            items={communicationItems}
            pathname={pathname}
            collapsed={false}
            unreadCounts={unreadCounts}
            onItemClick={onCloseMobile}
          />
          <NavGroup
            label="Account"
            items={accountItems}
            pathname={pathname}
            collapsed={false}
            unreadCounts={unreadCounts}
            onItemClick={onCloseMobile}
          />
        </nav>
      </aside>

      {/* Desktop Aside */}
      <aside
        className={`sticky top-16 shrink-0 z-20 hidden h-[calc(100vh-var(--admin-header-height,64px))] flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          <NavGroup
            label="Overview"
            items={overviewItems}
            pathname={pathname}
            collapsed={collapsed}
            unreadCounts={unreadCounts}
          />
          <NavGroup
            label="Teaching"
            items={teachingItems}
            pathname={pathname}
            collapsed={collapsed}
            unreadCounts={unreadCounts}
          />
          <NavGroup
            label="Communication"
            items={communicationItems}
            pathname={pathname}
            collapsed={collapsed}
            unreadCounts={unreadCounts}
          />
          <NavGroup
            label="Account"
            items={accountItems}
            pathname={pathname}
            collapsed={collapsed}
            unreadCounts={unreadCounts}
          />
        </nav>
      </aside>
    </>
  );
}
