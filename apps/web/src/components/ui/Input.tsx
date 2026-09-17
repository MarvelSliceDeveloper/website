"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/ui/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-foreground select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-muted transition-all duration-150",
              "focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/10",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-danger focus:border-danger focus:ring-danger/15 text-danger",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-danger font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
