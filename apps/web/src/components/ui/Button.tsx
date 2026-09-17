"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/ui/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.99] focus-visible:ring-primary border border-transparent",
      secondary:
        "bg-card text-foreground border border-border hover:bg-card-hover hover:border-border-hover shadow-2xs active:scale-[0.99] focus-visible:ring-primary",
      outline:
        "bg-transparent text-foreground border border-border hover:bg-muted/10 hover:border-border-hover active:scale-[0.99] focus-visible:ring-primary",
      ghost:
        "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10 active:scale-[0.99] focus-visible:ring-primary border border-transparent",
      danger:
        "bg-danger text-white hover:bg-danger/90 shadow-sm active:scale-[0.99] focus-visible:ring-danger border border-transparent",
      accent:
        "bg-brand-orange text-white hover:bg-brand-orange-dark shadow-sm active:scale-[0.99] focus-visible:ring-brand-orange border border-transparent",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9.5 px-4 text-sm rounded-xl gap-2",
      lg: "h-11 px-5 text-base rounded-xl gap-2.5",
      icon: "h-9.5 w-9.5 p-0 text-sm rounded-xl",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 shrink-0 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
