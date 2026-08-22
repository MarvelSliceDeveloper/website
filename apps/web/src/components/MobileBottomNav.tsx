"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconHome2,
  IconBook,
  IconVideo,
  IconCalendar,
  IconDots,
  IconCertificate,
  IconInbox,
  IconUsers,
  IconNotes,
  IconHelp,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";

interface MobileBottomNavProps {
  studentName: string;
  studentEmail: string;
  onLogout: () => void;
}

const TABS = [
  {
    key: "home",
    label: "Home",
    href: "/student",
    icon: IconHome2,
    match: (view: string | null) => !view,
  },
  {
    key: "courses",
    label: "Courses",
    href: "/student?view=courses",
    icon: IconBook,
    match: (view: string | null) => view === "courses",
  },
  {
    key: "sessions",
    label: "Live",
    href: "/student?view=sessions",
    icon: IconVideo,
    match: (view: string | null) => view === "sessions",
  },
  {
    key: "calendar",
    label: "Calendar",
    href: "/student?view=calendar",
    icon: IconCalendar,
    match: (view: string | null) => view === "calendar",
  },
] as const;

const MORE_ITEMS = [
  { label: "Certificates", href: "/student?view=certificates", icon: IconCertificate },
  { label: "Inbox", href: "/student/inbox", icon: IconInbox },
  { label: "Mentorship", href: "/student?view=mentorship", icon: IconUsers },
  { label: "Notes", href: "/student/notes", icon: IconNotes },
  { label: "Support", href: "/student/support", icon: IconHelp },
  { label: "Profile", href: "/student/settings", icon: IconUser },
] as const;

const MORE_VIEWS = ["certificates", "mentorship"];

export default function MobileBottomNav({
  studentName,
  studentEmail,
  onLogout,
}: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);

  const view = pathname === "/student" ? searchParams.get("view") : "__other__";

  const activeKey = TABS.find((t) => t.match(view))?.key ?? null;
  const moreActive =
    pathname === "/student/inbox" ||
    pathname === "/student/notes" ||
    pathname === "/student/settings" ||
    pathname === "/student/support" ||
    pathname === "/student/mentorship" ||
    MORE_VIEWS.includes(view ?? "");

  // Close the sheet whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient UI on navigation
    setMoreOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      {/* Bottom sheet for secondary destinations */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-7xl rounded-t-2xl border-t border-border bg-card px-4 pb-4 pt-3 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          moreOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="mb-2 px-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {studentName}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {studentEmail}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MORE_ITEMS.map((item) => {
            const isActive =
              (item.href.startsWith("/student?view=")
                ? item.href.split("view=")[1] === view
                : pathname === item.href) ||
              (item.label === "Mentorship" && pathname === "/student/mentorship");
            return (
              <button
                key={item.label}
                onClick={() => {
                  setMoreOpen(false);
                  router.push(item.href);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                <item.icon size={20} stroke={1.8} />
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            setMoreOpen(false);
            onLogout();
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-2 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <IconLogout size={18} stroke={1.8} />
          Logout
        </button>
      </div>

      {/* Fixed bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden">
        {TABS.map((tab) => {
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <tab.icon
                size={22}
                stroke={isActive ? 2.2 : 1.8}
                className={isActive ? "text-primary" : ""}
              />
              {tab.label}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            moreOpen || moreActive
              ? "text-primary"
              : "text-muted-foreground"
          }`}
          aria-expanded={moreOpen}
        >
          <IconDots
            size={22}
            stroke={moreOpen || moreActive ? 2.2 : 1.8}
            className={moreOpen || moreActive ? "text-primary" : ""}
          />
          More
        </button>
      </nav>
    </>
  );
}
