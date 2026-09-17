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
    iconBg: string;
    iconText: string;
  }
> = {
  blue: {
    border: "border-border hover:border-primary/40",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  green: {
    border: "border-border hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600",
  },
  orange: {
    border: "border-border hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600",
  },
  red: {
    border: "border-border hover:border-rose-500/40",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600",
  },
  purple: {
    border: "border-border hover:border-indigo-500/40",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-600",
  },
  teal: {
    border: "border-border hover:border-teal-500/40",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600",
  },
  amber: {
    border: "border-border hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600",
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
      className={`group relative block rounded-lg border bg-card p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.07),0_8px_10px_-6px_rgba(0,0,0,0.04)] ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex shrink-0 items-center justify-center rounded-md bg-card p-2 ring-1 ring-border">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-md ${style.iconBg} ${style.iconText}`}
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
