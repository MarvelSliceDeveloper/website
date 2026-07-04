"use client";

import AppShell from "./AppShell";
import InstructorSidebar from "./InstructorSidebar";

// Instructor shell wrapping AppShell with instructor sidebar
export default function InstructorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      sidebar={(props) => <InstructorSidebar {...props} />}
      inboxHref="/instructor/inbox"
    >
      {children}
    </AppShell>
  );
}
