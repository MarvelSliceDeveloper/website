"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconSettings, IconLogout, IconMenu2 } from "@tabler/icons-react";
import { api } from "@/lib/api";
import HeaderNotifications from "./HeaderNotifications";

interface HeaderProps {
  inboxHref?: string;
  userName?: string;
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
}

export default function Header({
  inboxHref = "/admin/inbox",
  userName = "",
  userEmail = "",
  collapsed = false,
  onToggleCollapse,
  mobileNavOpen = false,
  onToggleMobileNav,
}: HeaderProps) {
  const router = useRouter();

  const settingsHref = inboxHref.replace("/inbox", "/settings");

  const handleSignOut = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-full items-center gap-3 md:gap-4 px-4 h-16 md:h-[68px] md:px-6">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              onToggleMobileNav?.();
            } else {
              onToggleCollapse?.();
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/15 transition-colors rounded-lg cursor-pointer"
          title={mobileNavOpen ? "Close menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle navigation"
        >
          <IconMenu2 size={20} stroke={1.8} />
        </button>

        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => {
            const base = inboxHref.startsWith("/instructor")
              ? "/instructor/dashboard"
              : "/admin/dashboard";
            router.push(base);
          }}
        >
          <Image
            src="/images/logo.svg"
            alt="Marvel Slice"
            width={48}
            height={48}
            priority
            className="h-11 md:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
          />
          <span className="text-lg sm:text-xl font-black tracking-tight text-foreground hidden sm:flex items-center">
            <span className="text-[#2551d9]">Marvel</span>
            <span className="text-[#f59e0b] ml-1">Slice</span>
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {userEmail && (
            <>
              <span
                className="hidden max-w-[200px] truncate text-[13px] text-muted-foreground sm:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
              <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            </>
          )}

          <HeaderNotifications inboxHref={inboxHref} />

          <button
            onClick={() => router.push(settingsHref)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition-colors hover:bg-violet-500/15 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            aria-label="Settings"
          >
            <IconSettings size={17} stroke={1.8} />
          </button>

          <button
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger transition-colors hover:bg-danger/15"
            aria-label="Sign out"
          >
            <IconLogout size={17} stroke={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
