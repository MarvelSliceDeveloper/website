"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function FormModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: FormModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) return;
    const timer = requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("button, input, select, textarea")
        ?.focus();
    });
    return () => cancelAnimationFrame(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        className="flex h-full w-full flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-muted/20 hover:text-foreground"
            aria-label="Close dialog"
          >
            <IconX size={20} stroke={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className={`mx-auto w-full ${sizeMap[size]} space-y-4`}>
            {children}
          </div>
        </div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/50 bg-card px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
