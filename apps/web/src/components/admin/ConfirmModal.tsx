"use client";

import { useCallback, useEffect, useRef, type ComponentType } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  variant?: "danger" | "primary";
  icon?: ComponentType<{ size?: number | string; stroke?: number | string }>;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmDisabled = false,
  confirmLoading = false,
  variant = "primary",
  icon: Icon,
}: ConfirmModalProps) {
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
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm border border-border bg-card p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {Icon && (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center bg-muted/10">
              <Icon size={20} stroke={1.5} />
            </div>
          </div>
        )}

        <h3 className="text-base font-bold text-foreground text-center">
          {title}
        </h3>
        <p className="text-sm text-muted text-center">{description}</p>

        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            className="btn-secondary text-sm"
            onClick={onClose}
            disabled={confirmLoading}
          >
            Cancel
          </button>
          <button
            className={
              variant === "danger"
                ? "btn-danger text-sm inline-flex items-center gap-1.5"
                : "btn-primary text-sm inline-flex items-center gap-1.5"
            }
            onClick={onConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
