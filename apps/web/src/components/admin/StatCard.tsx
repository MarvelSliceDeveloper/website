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

const iconBg: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
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
      <div className="border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-10 w-10 animate-pulse bg-border" />
            <div className="h-3 w-24 animate-pulse bg-border mt-2" />
            <div className="h-7 w-16 animate-pulse bg-border mt-2" />
          </div>
        </div>
      </div>
    );
  }

  const displayValue = value === null ? "\u2014" : String(value);

  const cardContent = (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">
            {displayValue}
          </p>
          {trend && (
            <div className="mt-1 flex items-center gap-1">
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
                className={`text-xs font-medium ${trend.positive ? "text-success" : "text-danger"}`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center ${iconBg[variant]}`}
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
