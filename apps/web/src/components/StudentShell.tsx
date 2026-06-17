"use client";

import AppShell from "./AppShell";
import Sidebar from "./Sidebar";

export default function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={(props) => <Sidebar {...props} />}
      inboxHref="/student/inbox"
    >
      {children}
    </AppShell>
  );
}
