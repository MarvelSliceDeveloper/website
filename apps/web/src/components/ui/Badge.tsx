"use client";

import React from "react";
import { cn } from "@/lib/ui/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-primary/10 text-primary border-primary/20",
    secondary:
      "bg-muted/15 text-muted-foreground border-border",
    success:
      "bg-success/10 text-success border-success/20",
    warning:
      "bg-warning/10 text-warning border-warning/20",
    danger:
      "bg-danger/10 text-danger border-danger/20",
    info:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    outline:
      "bg-transparent text-foreground border-border",
  };

  const dotStyles = {
    default: "bg-primary",
    secondary: "bg-muted",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-blue-500",
    outline: "bg-foreground",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium leading-none",
    md: "px-2.5 py-1 text-xs font-semibold leading-none",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
