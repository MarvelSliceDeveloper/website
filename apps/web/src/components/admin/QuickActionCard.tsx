import Link from "next/link";
import type { ComponentType } from "react";
import { IconChevronRight } from "@tabler/icons-react";

type QuickActionVariant =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "teal"
  | "amber";

interface QuickActionCardProps {
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number | string;
    stroke?: number | string;
  }>;
  description?: string;
  variant?: QuickActionVariant;
}

const variantStyles: Record<
  QuickActionVariant,
  {
    border: string;
    bg: string;
    text: string;
    iconBg: string;
    iconText: string;
  }
> = {
  blue: {
    border: "border-blue-500/30 hover:border-blue-500/50",
    bg: "bg-gradient-to-br from-blue-500/15 via-blue-500/6 to-transparent",
    text: "text-blue-500",
    iconBg: "bg-blue-500/20",
    iconText: "text-blue-500",
  },
  green: {
    border: "border-green-500/30 hover:border-green-500/50",
    bg: "bg-gradient-to-br from-green-500/15 via-green-500/6 to-transparent",
    text: "text-green-500",
    iconBg: "bg-green-500/20",
    iconText: "text-green-500",
  },
  orange: {
    border: "border-orange-500/30 hover:border-orange-500/50",
    bg: "bg-gradient-to-br from-orange-500/15 via-orange-500/6 to-transparent",
    text: "text-orange-500",
    iconBg: "bg-orange-500/20",
    iconText: "text-orange-500",
  },
  red: {
    border: "border-red-500/30 hover:border-red-500/50",
    bg: "bg-gradient-to-br from-red-500/15 via-red-500/6 to-transparent",
    text: "text-red-500",
    iconBg: "bg-red-500/20",
    iconText: "text-red-500",
  },
  purple: {
    border: "border-purple-500/30 hover:border-purple-500/50",
    bg: "bg-gradient-to-br from-purple-500/15 via-purple-500/6 to-transparent",
    text: "text-purple-500",
    iconBg: "bg-purple-500/20",
    iconText: "text-purple-500",
  },
  teal: {
    border: "border-teal-500/30 hover:border-teal-500/50",
    bg: "bg-gradient-to-br from-teal-500/15 via-teal-500/6 to-transparent",
    text: "text-teal-500",
    iconBg: "bg-teal-500/20",
    iconText: "text-teal-500",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    bg: "bg-gradient-to-br from-amber-500/15 via-amber-500/6 to-transparent",
    text: "text-amber-500",
    iconBg: "bg-amber-500/20",
    iconText: "text-amber-500",
  },
};

export default function QuickActionCard({
  label,
  href,
  icon: Icon,
  description,
  variant = "blue",
}: QuickActionCardProps) {
  const style = variantStyles[variant];

  return (
    <Link
      href={href}
      className={`group relative block rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${style.border} ${style.bg} bg-card`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-card p-2 ring-1 ring-border">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}
          >
            <Icon size={22} stroke={1.8} />
          </div>
        </div>
        <IconChevronRight
          size={16}
          stroke={1.5}
          className="text-muted-foreground/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </Link>
  );
}
