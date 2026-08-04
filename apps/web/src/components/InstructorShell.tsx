"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppShell from "./AppShell";
import InstructorSidebar from "./InstructorSidebar";
import { api } from "@/lib/api";

export default function InstructorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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

  // Onboarding route — render standalone without sidebar/header
  if (pathname?.startsWith("/instructor/onboarding")) {
    return <>{children}</>;
  }

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
