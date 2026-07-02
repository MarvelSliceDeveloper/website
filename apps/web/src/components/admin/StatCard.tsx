"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: string | number | null;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
    positive?: boolean;
  };
  loading?: boolean;
  gradient?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  loading = false,
  gradient = "from-primary to-violet-500",
}: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-11 w-11 rounded-xl animate-pulse bg-card-hover" />
            <div className="h-3 w-24 animate-pulse bg-card-hover rounded mt-2" />
            <div className="h-8 w-16 animate-pulse bg-card-hover rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  const displayValue = value === null ? "\u2014" : String(value);

  const cardContent = (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {displayValue}
          </p>
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend.direction === "up" ? (
                <IconTrendingUp size={16} className={trend.positive ? "text-success" : "text-danger"} />
              ) : (
                <IconTrendingDown size={16} className={trend.positive ? "text-success" : "text-danger"} />
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
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-lg group-hover:scale-110 transition-transform`}
        >
          <Icon size={22} stroke={1.5} />
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
