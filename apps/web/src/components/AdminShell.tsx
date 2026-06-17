"use client";

import AppShell from "./AppShell";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={(props) => <AdminSidebar {...props} />}
      inboxHref="/admin/inbox"
    >
      {children}
    </AppShell>
  );
}
