"use client";

import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import InstructorSidebar from "./InstructorSidebar";
import { api } from "@/lib/api";

export default function InstructorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    api
      .get<{ user: { name: string; email: string } }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
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
          <InstructorSidebar
            {...props}
            userName={userName}
            userEmail={userEmail}
          />
        )}
        inboxHref="/instructor/inbox"
        userName={userName}
        userEmail={userEmail}
      >
        {children}
      </AppShell>
    </div>
  );
}
