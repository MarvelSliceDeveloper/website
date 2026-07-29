"use client";

import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import AdminSidebar from "./AdminSidebar";
import { api } from "@/lib/api";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userRole, setUserRole] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    api
      .get<{ user: { role: string; name: string; email: string } }>(
        "/api/auth/me",
      )
      .then((res) => {
        if (res?.user) {
          setUserRole(res.user.role);
          setUserName(res.user.name);
          setUserEmail(res.user.email);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div data-section="admin">
      <AppShell
        sidebar={(props) => (
          <AdminSidebar
            {...props}
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
          />
        )}
        inboxHref="/admin/inbox"
        userName={userName}
        userEmail={userEmail}
      >
        {children}
      </AppShell>
    </div>
  );
}
