"use client";

import React from "react";
import { cn } from "@/lib/ui/utils";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  helperText?: string;
  description?: string;
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  optional = false,
  error,
  helperText,
  description,
  className,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="block text-xs sm:text-sm font-semibold text-foreground select-none"
          >
            {label}
            {required && <span className="ml-1 text-danger">*</span>}
          </label>
          {optional && (
            <span className="text-[11px] font-normal text-muted-foreground">
              Optional
            </span>
          )}
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger mt-1 animate-in fade-in-50 duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
