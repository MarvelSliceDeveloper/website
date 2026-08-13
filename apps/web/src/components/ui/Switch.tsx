"use client";

import { cn } from "@/lib/ui/utils";

type SwitchProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  label,
}: SwitchProps) {
  const trackSizes =
    size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumbSizes =
    size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const thumbOffset =
    size === "sm" ? (checked ? "translate-x-4" : "translate-x-0.5") : (checked ? "translate-x-[22px]" : "translate-x-0.5");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40",
        trackSizes,
        checked
          ? "bg-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
          : "bg-border dark:bg-slate-600",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200",
          thumbSizes,
          thumbOffset,
        )}
      />
    </button>
  );
}