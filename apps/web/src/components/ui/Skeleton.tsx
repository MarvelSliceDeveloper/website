"use client";

import React from "react";
import { cn } from "@/lib/ui/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text";
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-xl",
    circular: "rounded-full",
    text: "rounded-md h-4 w-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted/20 dark:bg-muted/10",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
