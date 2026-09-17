"use client";

import React, { useEffect, createContext, useContext } from "react";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/ui/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideClose?: boolean;
}

export function DialogContent({
  className,
  children,
  hideClose = false,
  ...props
}: DialogContentProps) {
  const { onOpenChange } = useContext(DialogContext);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className,
      )}
      {...props}
    >
      {!hideClose && (
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted/15 hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <IconX size={18} />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg sm:text-xl font-bold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6",
        className,
      )}
      {...props}
    />
  );
}
