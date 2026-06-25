"use client";

import { useState } from "react";
import Header from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  sidebar: (props: { collapsed: boolean; onToggleCollapse: () => void }) => React.ReactNode;
  inboxHref: string;
}

// App shell layout with sidebar and header
export default function AppShell({ children, sidebar, inboxHref }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {sidebar({
        collapsed: isSidebarCollapsed,
        onToggleCollapse: () => setIsSidebarCollapsed((v) => !v),
      })}
      <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
          inboxHref={inboxHref}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
