"use client";

import AppShell from "./AppShell";
import AdminSidebar from "./AdminSidebar";

// Admin shell wrapping AppShell with admin sidebar
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-section="admin">
      <AppShell
        sidebar={(props) => <AdminSidebar {...props} />}
        inboxHref="/admin/inbox"
      >
        {children}
      </AppShell>
    </div>
  );
}
