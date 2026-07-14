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
    border: "border-blue-500/30 hover:border-blue-500/50",
    bg: "bg-gradient-to-br from-blue-500/15 via-blue-400/8 to-cyan-400/5",
    text: "text-blue-600",
    iconBg: "bg-blue-500/20 text-blue-600 border border-blue-500/25",
  },
  green: {
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    bg: "bg-gradient-to-br from-emerald-500/15 via-emerald-400/8 to-green-400/5",
    text: "text-emerald-600",
    iconBg: "bg-emerald-500/20 text-emerald-600 border border-emerald-500/25",
  },
  orange: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    bg: "bg-gradient-to-br from-amber-500/15 via-amber-400/8 to-orange-400/5",
    text: "text-amber-600",
    iconBg: "bg-amber-500/20 text-amber-600 border border-amber-500/25",
  },
  red: {
    border: "border-rose-500/30 hover:border-rose-500/50",
    bg: "bg-gradient-to-br from-rose-500/15 via-rose-400/8 to-red-400/5",
    text: "text-rose-600",
    iconBg: "bg-rose-500/20 text-rose-600 border border-rose-500/25",
  },
  purple: {
    border: "border-violet-500/30 hover:border-violet-500/50",
    bg: "bg-gradient-to-br from-violet-500/15 via-violet-400/8 to-purple-400/5",
    text: "text-violet-600",
    iconBg: "bg-violet-500/20 text-violet-600 border border-violet-500/25",
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
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-10 w-10 animate-pulse bg-border rounded-xl" />
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
    <div className={`border p-4 transition-all duration-300 rounded-2xl ${style.border} ${style.bg} bg-card`}>
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
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
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
