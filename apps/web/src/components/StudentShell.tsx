"use client";

import AppShell from "./AppShell";
import Sidebar from "./Sidebar";

// Student shell wrapping AppShell with student sidebar
export default function StudentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      sidebar={(props) => <Sidebar {...props} />}
      inboxHref="/student/inbox"
    >
      {children}
    </AppShell>
  );
}
