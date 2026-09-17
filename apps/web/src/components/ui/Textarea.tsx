"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/ui/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs sm:text-sm font-semibold text-foreground select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted shadow-2xs transition-all duration-150 resize-y",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/10",
            error &&
              "border-danger focus:border-danger focus:ring-danger/20 text-danger",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
