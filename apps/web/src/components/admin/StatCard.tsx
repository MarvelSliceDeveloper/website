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

// Solid bold diagonal gradients (135deg) — one distinct hue per variant so
// cards in a set are distinguishable by color alone. Same palette as
// GradientStatCard so every stat card in the app shares one look.
const variantGradients: Record<string, { from: string; to: string }> = {
  blue: { from: "#2563EB", to: "#4F46E5" },
  green: { from: "#14B8A6", to: "#22C55E" },
  orange: { from: "#FB923C", to: "#F87171" },
  red: { from: "#EC4899", to: "#EF4444" },
  purple: { from: "#8B5CF6", to: "#6366F1" },
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
  const gradient = variantGradients[variant] ?? variantGradients.blue;
  const background = `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`;
  const cardShadow = "0 12px 24px -10px rgba(0,0,0,.25)";

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="relative overflow-hidden rounded-[18px] p-5"
        style={{ background, boxShadow: cardShadow }}
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/25" />
        <div className="mt-4 h-9 w-24 animate-pulse rounded-md bg-white/25" />
        <div className="mt-2 h-3.5 w-32 animate-pulse rounded bg-white/25" />
      </div>
    );
  }

  const displayValue = value === null ? "\u2014" : String(value);

  const cardContent = (
    <div
      className="relative overflow-hidden rounded-[18px] p-5 text-white transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background, boxShadow: cardShadow }}
    >
      {/* Decorative translucent circles, clipped to the card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          top: -56,
          right: -56,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.14)",
          top: 28,
          right: 60,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/85">
          {label}
        </p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon size={20} stroke={1.8} />
        </span>
      </div>
      <p className="relative mt-3 text-3xl font-extrabold tracking-tight">
        {displayValue}
      </p>
      {trend && (
        <div className="relative mt-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
            {trend.direction === "up" ? (
              <IconTrendingUp size={13} stroke={2.2} />
            ) : (
              <IconTrendingDown size={13} stroke={2.2} />
            )}
            {trend.value}
          </span>
          <span className="text-[11px] text-white/80">vs last period</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
