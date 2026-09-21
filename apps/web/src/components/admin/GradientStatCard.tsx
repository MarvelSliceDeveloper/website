import Link from "next/link";

export type GradientTone =
  "pink" | "blue" | "teal" | "orange" | "purple" | "crimson";

interface GradientStatCardProps {
  label: string;
  value: string | number | null;
  icon: React.ComponentType<{
    size?: number | string;
    stroke?: number | string;
  }>;
  tone?: GradientTone;
  subtitle?: string;
  href?: string;
  loading?: boolean;
}

// Solid bold diagonal gradients (135deg) — one distinct hue per tone so
// cards in a set are distinguishable by color alone.
const toneGradients: Record<GradientTone, { from: string; to: string }> = {
  pink: { from: "#EC4899", to: "#EF4444" },
  blue: { from: "#2563EB", to: "#4F46E5" },
  teal: { from: "#14B8A6", to: "#22C55E" },
  orange: { from: "#FB923C", to: "#F87171" },
  purple: { from: "#8B5CF6", to: "#6366F1" },
  crimson: { from: "#F43F5E", to: "#BE123C" },
};

export default function GradientStatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  subtitle,
  href,
  loading = false,
}: GradientStatCardProps) {
  if (loading) {
    const gradient = toneGradients[tone];
    return (
      <div
        aria-busy="true"
        className="relative overflow-hidden rounded-[18px] p-5"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          boxShadow: "0 12px 24px -10px rgba(0,0,0,.25)",
        }}
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/25" />
        <div className="mt-4 h-9 w-24 animate-pulse rounded-md bg-white/25" />
        <div className="mt-2 h-3.5 w-32 animate-pulse rounded bg-white/25" />
      </div>
    );
  }

  const displayValue = value === null ? "—" : String(value);
  const gradient = toneGradients[tone] ?? toneGradients.blue;

  const cardContent = (
    <div
      className="relative overflow-hidden rounded-[18px] p-5 text-white transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        boxShadow: "0 12px 24px -10px rgba(0,0,0,.25)",
      }}
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
      {subtitle && (
        <p className="relative mt-1.5 text-xs font-medium text-white/80">
          {subtitle}
        </p>
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
