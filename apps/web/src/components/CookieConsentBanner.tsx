"use client";

import { useState, useEffect } from "react";
import { IconCookie } from "@tabler/icons-react";

const CONSENT_KEY = "lms-cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on page load
      const id = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(id);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-card/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconCookie
            size={24}
            stroke={1.5}
            className="mt-0.5 shrink-0 text-primary"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              We use cookies
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              This site uses essential and analytics cookies to improve your
              experience. You can accept or decline non-essential cookies.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={decline}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/10"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
