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
    border: "border-primary/30 hover:border-primary/50",
    bg: "bg-gradient-to-br from-primary/15 via-primary/8 to-accent/5",
    text: "text-primary",
    iconBg: "bg-primary/20 text-primary border border-primary/25",
  },
  green: {
    border: "border-success/30 hover:border-success/50",
    bg: "bg-gradient-to-br from-success/15 via-success/8 to-success/5",
    text: "text-success",
    iconBg: "bg-success/20 text-success border border-success/25",
  },
  orange: {
    border: "border-warning/30 hover:border-warning/50",
    bg: "bg-gradient-to-br from-warning/15 via-warning/8 to-warning/5",
    text: "text-warning",
    iconBg: "bg-warning/20 text-warning border border-warning/25",
  },
  red: {
    border: "border-danger/30 hover:border-danger/50",
    bg: "bg-gradient-to-br from-danger/15 via-danger/8 to-danger/5",
    text: "text-danger",
    iconBg: "bg-danger/20 text-danger border border-danger/25",
  },
  purple: {
    border: "border-accent/30 hover:border-accent/50",
    bg: "bg-gradient-to-br from-accent/15 via-accent/8 to-accent/5",
    text: "text-accent",
    iconBg: "bg-accent/20 text-accent border border-accent/25",
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
    <div
      className={`border p-4 transition-all duration-300 rounded-2xl ${style.border} ${style.bg} bg-card`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p
            className={`mt-1.5 text-2xl font-extrabold tracking-tight ${style.text}`}
          >
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
