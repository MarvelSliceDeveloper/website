"use client";

import type { ReactNode } from "react";
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
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export function FormModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: FormModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeMap[size]} glass-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            <IconX size={20} stroke={1.5} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
