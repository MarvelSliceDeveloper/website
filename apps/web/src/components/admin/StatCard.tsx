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
  { border: string; iconBg: string; text: string; badgeBg: string }
> = {
  blue: {
    border: "border-border hover:border-primary/40",
    iconBg: "bg-primary/10 text-primary border border-primary/20",
    text: "text-foreground",
    badgeBg: "bg-primary/10 text-primary",
  },
  green: {
    border: "border-border hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    text: "text-foreground",
    badgeBg: "bg-emerald-500/10 text-emerald-600",
  },
  orange: {
    border: "border-border hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    text: "text-foreground",
    badgeBg: "bg-amber-500/10 text-amber-600",
  },
  red: {
    border: "border-border hover:border-rose-500/40",
    iconBg: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
    text: "text-foreground",
    badgeBg: "bg-rose-500/10 text-rose-600",
  },
  purple: {
    border: "border-border hover:border-indigo-500/40",
    iconBg: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
    text: "text-foreground",
    badgeBg: "bg-indigo-500/10 text-indigo-600",
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
      <div className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-10 w-10 animate-pulse bg-muted/20 rounded-lg" />
            <div className="h-3.5 w-24 animate-pulse bg-muted/20 mt-4 rounded" />
            <div className="h-8 w-20 animate-pulse bg-muted/20 mt-2 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const displayValue = value === null ? "\u2014" : String(value);
  const style = variantStyles[variant] || variantStyles.blue;

  const cardContent = (
    <div
      className={`rounded-lg border bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.07),0_8px_10px_-6px_rgba(0,0,0,0.04)] ${style.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-extrabold tracking-tight ${style.text}`}
          >
            {displayValue}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold ${
                  trend.positive
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                }`}
              >
                {trend.direction === "up" ? (
                  <IconTrendingUp size={13} stroke={2.2} />
                ) : (
                  <IconTrendingDown size={13} stroke={2.2} />
                )}
                {trend.value}
              </span>
              <span className="text-[11px] text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${style.iconBg}`}
        >
          <Icon size={20} stroke={1.8} />
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
