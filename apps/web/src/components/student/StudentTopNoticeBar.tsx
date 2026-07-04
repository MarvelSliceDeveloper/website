"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";

interface StudentTopNoticeBarProps {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  dismissKey?: string;
}

// Dismissible top announcement bar with CTA link
export default function StudentTopNoticeBar({
  text,
  ctaLabel = "Join Now",
  ctaHref,
  dismissKey = "lms-student-top-notice-dismissed",
}: StudentTopNoticeBarProps) {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(dismissKey) === "1";
  });

  if (hidden) return null;

  return (
    <div className="border-b border-blue-700/60 bg-linear-to-r from-blue-600 to-blue-500 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:px-6">
        <p className="truncate text-xs font-medium sm:text-sm">{text}</p>
        <div className="flex items-center gap-2">
          {ctaHref ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              {ctaLabel}
            </a>
          ) : null}
          <button
            onClick={() => {
              setHidden(true);
              window.localStorage.setItem(dismissKey, "1");
            }}
            className="rounded-md p-1 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss announcement"
          >
            <IconX size={14} stroke={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
