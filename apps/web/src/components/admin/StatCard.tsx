"use client";

import Link from "next/link";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: string | number | null;
  icon: React.ComponentType<{
    size?: number | string;
    stroke?: number | string;
  }>;
  href?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
    positive?: boolean;
  };
  loading?: boolean;
  variant?: "blue" | "green" | "orange" | "red" | "purple";
}

const variantStyles: Record<
  string,
  { border: string; bg: string; text: string; iconBg: string }
> = {
  blue: {
    border: "border-accent/25 hover:border-accent/40",
    bg: "bg-gradient-to-br from-accent/10 via-accent/5 to-cyan-400/[0.02]",
    text: "text-accent",
    iconBg: "bg-accent/15 text-accent border border-accent/20",
  },
  green: {
    border: "border-success/25 hover:border-success/40",
    bg: "bg-gradient-to-br from-success/10 via-success/5 to-emerald-400/[0.02]",
    text: "text-success",
    iconBg: "bg-success/15 text-success border border-success/20",
  },
  orange: {
    border: "border-warning/25 hover:border-warning/40",
    bg: "bg-gradient-to-br from-warning/10 via-warning/5 to-amber-400/[0.02]",
    text: "text-warning",
    iconBg: "bg-warning/15 text-warning border border-warning/20",
  },
  red: {
    border: "border-danger/25 hover:border-danger/40",
    bg: "bg-gradient-to-br from-danger/10 via-danger/5 to-red-400/[0.02]",
    text: "text-danger",
    iconBg: "bg-danger/15 text-danger border border-danger/20",
  },
  purple: {
    border: "border-primary/25 hover:border-primary/40",
    bg: "bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/[0.02]",
    text: "text-primary",
    iconBg: "bg-primary/15 text-primary border border-primary/20",
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  loading = false,
  variant = "blue",
}: StatCardProps) {
  if (loading) {
    return (
      <div className="border border-border bg-card p-4 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-10 w-10 animate-pulse bg-border rounded-lg" />
            <div className="h-3 w-24 animate-pulse bg-border mt-3 rounded" />
            <div className="h-7 w-16 animate-pulse bg-border mt-2 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const displayValue = value === null ? "\u2014" : String(value);
  const style = variantStyles[variant] || variantStyles.blue;

  const cardContent = (
    <div className={`border p-4 transition-all duration-300 rounded-xl ${style.border} ${style.bg} bg-card`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${style.text}`}>
            {displayValue}
          </p>
          {trend && (
            <div className="mt-1.5 flex items-center gap-1">
              {trend.direction === "up" ? (
                <IconTrendingUp
                  size={14}
                  className={trend.positive ? "text-success" : "text-danger"}
                />
              ) : (
                <IconTrendingDown
                  size={14}
                  className={trend.positive ? "text-success" : "text-danger"}
                />
              )}
              <span
                className={`text-xs font-semibold ${trend.positive ? "text-success" : "text-danger"}`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
        >
          <Icon size={20} stroke={1.5} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group cursor-pointer block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
