"use client";

import type { ComponentType } from "react";

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
  icon?: ComponentType<{ size?: number; stroke?: number }>;
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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {Icon && (
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-card-hover p-3">
              <Icon size={10} stroke={1.2} />
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="flex items-center justify-center gap-3 pt-2">
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
                ? "rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                : "btn-primary text-sm inline-flex items-center gap-1.5"
            }
            onClick={onConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
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
