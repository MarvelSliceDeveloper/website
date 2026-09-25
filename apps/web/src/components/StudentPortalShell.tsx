/**
 * StudentPortalShell — the main layout wrapper for all student-facing views.
 *
 * Renders a sticky header with logo, breadcrumbs, notifications, and user controls,
 * plus a scrollable <main> content area. Child views are passed via `children`.
 *
 * Key features:
 * - Sticky header with --shell-header-height CSS variable for child height calculations
 * - Notification bell with real-time polling (30s interval), mark read individually/all
 * - Responsive: email hidden on mobile, breadcrumbs hidden below md breakpoint
 *
 * @example
 * <StudentPortalShell breadcrumbs={[{ label: "Courses" }]} showBack onBack={() => ...}>
 *   <CoursesView />
 * </StudentPortalShell>
 */
"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconLogout,
  IconBook,
  IconInbox,
  IconUser,
  IconChevronDown,
} from "@tabler/icons-react";
import { api } from "@/lib/api";
import MobileBottomNav from "@/components/MobileBottomNav";
import HeaderNotifications from "@/components/HeaderNotifications";

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface StudentPortalShellProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  onBack?: () => void;
  showBack?: boolean;
  studentName?: string;
  studentEmail?: string;
  hideProfile?: boolean;
  hideLogo?: boolean;
  hideHeader?: boolean;
  fullWidth?: boolean;
  hideMobileNav?: boolean;
}

// Student portal shell with header, breadcrumbs, and notifications
export default function StudentPortalShell({
  children,
  breadcrumbs = [],
  onBack,
  showBack = false,
  studentName = "Student",
  studentEmail = "student@example.com",
  hideProfile = false,
  hideLogo = false,
  hideHeader = false,
  fullWidth = false,
  hideMobileNav = false,
}: StudentPortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Log out the user and redirect to login
  async function handleSignOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/login");
  }

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div
      className="min-h-[100dvh] bg-background"
      style={
        { "--shell-header-height": headerHeight + "px" } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      {!hideHeader && (
        <header
          ref={headerRef}
          className="sticky top-0 z-40 border-b border-border bg-card"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 md:px-6 md:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {!hideLogo && (
                <div
                  className="flex items-center gap-2.5 cursor-pointer select-none group"
                  onClick={() => router.push("/student")}
                >
                  <Image
                    src="/images/logo.svg"
                    alt="Marvel Slice"
                    width={48}
                    height={48}
                    priority
                    className="h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
                  />
                  <span className="text-lg sm:text-xl font-black tracking-tight text-ink flex items-center">
                    <span className="text-[#2551d9]">Marvel</span>
                    <span className="text-[#f59e0b] ml-1">Slice</span>
                  </span>
                </div>
              )}

              <button
                onClick={onBack}
                className={`sp-back-btn flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted transition-all hover:border-primary/40 hover:text-foreground ${
                  showBack
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-label="Go back"
              >
                <IconArrowLeft size={15} stroke={2} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {breadcrumbs.length > 0 && (
                <nav
                  aria-label="Breadcrumb"
                  className="hidden min-w-0 items-center gap-1 overflow-hidden text-xs text-muted md:flex"
                >
                  {breadcrumbs.map((crumb, i) => {
                    const isActive = i === breadcrumbs.length - 1;
                    return (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-border">/</span>}
                        {crumb.onClick && !isActive ? (
                          <button
                            onClick={crumb.onClick}
                            className="max-w-35 truncate transition-colors hover:text-foreground"
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span
                            aria-current={isActive ? "page" : undefined}
                            className={`max-w-35 truncate ${
                              isActive
                                ? "font-bold text-primary"
                                : "text-muted-foreground"
                            }`}
                          >
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex items-center gap-2">
              <HeaderNotifications inboxHref="/student/inbox" realtime />

              {!hideProfile && (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl bg-mist px-3 py-1.5 text-slate transition-colors hover:bg-hairline hover:text-ink"
                    aria-label="Profile menu"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-[12px] font-bold text-white">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden text-[13px] font-medium sm:inline">
                      {studentName}
                    </span>
                    <IconChevronDown
                      size={14}
                      className={`shrink-0 text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border bg-card py-1.5 shadow-2xl origin-top-right"
                      style={{
                        animation: "dropdown-in 0.15s ease-out both",
                      }}
                    >
                      <div className="border-b border-border px-4 py-2.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {studentName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {studentEmail}
                        </p>
                      </div>

                      {[
                        {
                          label: "Courses",
                          icon: IconBook,
                          href: "/student?view=courses",
                          match: () =>
                            pathname === "/student" &&
                            searchParams.get("view") === "courses",
                        },
                        {
                          label: "Inbox",
                          icon: IconInbox,
                          href: "/student/inbox",
                          match: () => pathname.startsWith("/student/inbox"),
                        },
                        {
                          label: "Profile",
                          icon: IconUser,
                          href: "/student/settings",
                          match: () => pathname.startsWith("/student/settings"),
                        },
                      ].map((item) => {
                        const isActive = item.match();
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              router.push(item.href);
                              setProfileOpen(false);
                            }}
                            className={`group flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground hover:bg-primary/8 hover:text-primary"
                            }`}
                          >
                            <item.icon
                              size={16}
                              className={`shrink-0 transition-colors ${
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-primary"
                              }`}
                            />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger transition-all hover:bg-danger/10"
                        >
                          <IconLogout
                            size={16}
                            className="shrink-0 text-danger/70 group-hover:text-danger transition-colors"
                          />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main
        className={`w-full ${
          hideHeader || fullWidth
            ? ""
            : `mx-auto max-w-7xl px-4 ${
                hideMobileNav ? "py-6" : "pt-6 pb-20 md:pb-6"
              } md:px-6`
        }`}
      >
        {children}
      </main>

      {!hideMobileNav && (
        <MobileBottomNav
          studentName={studentName}
          studentEmail={studentEmail}
          onLogout={handleSignOut}
        />
      )}
    </div>
  );
}
