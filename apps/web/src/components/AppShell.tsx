"use client";

import { useState } from "react";
import Header from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: (props: {
    collapsed: boolean;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
  }) => React.ReactNode;
  inboxHref: string;
  userName?: string;
  userEmail?: string;
}

export default function AppShell({
  children,
  sidebar,
  inboxHref,
  userName = "",
  userEmail = "",
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        inboxHref={inboxHref}
        userName={userName}
        userEmail={userEmail}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        mobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((v) => !v)}
      />
      <div className="flex min-h-[calc(100vh-var(--admin-header-height,64px))] w-full">
        {sidebar({
          collapsed: isSidebarCollapsed,
          mobileOpen: isMobileNavOpen,
          onCloseMobile: () => setIsMobileNavOpen(false),
        })}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
