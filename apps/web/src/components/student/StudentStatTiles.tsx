"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconTrendingUp } from "@tabler/icons-react";

export interface StudentStatTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
  iconColor: "blue" | "orange" | "green" | "indigo" | "amber" | "red";
  liveBadge?: string;
  trend?: { value: number; label: string };
}

interface StudentStatTilesProps {
  tiles: StudentStatTile[];
  className?: string;
}

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return count;
}

const TILE_STYLES: Record<string, { gradient: string; glow: string; chip: string; icon: string }> = {
  blue: {
    gradient: "bg-gradient-to-br from-white via-brand-blue/[0.06] to-brand-blue/[0.12]",
    glow: "after:bg-brand-blue/20",
    chip: "bg-gradient-to-br from-brand-blue-tint to-brand-blue/20",
    icon: "text-brand-blue",
  },
  orange: {
    gradient: "bg-gradient-to-br from-white via-brand-orange/[0.06] to-brand-orange/[0.12]",
    glow: "after:bg-brand-orange/20",
    chip: "bg-gradient-to-br from-brand-orange-tint to-brand-orange/20",
    icon: "text-brand-orange",
  },
  green: {
    gradient: "bg-gradient-to-br from-white via-success/[0.06] to-success/[0.12]",
    glow: "after:bg-success/20",
    chip: "bg-gradient-to-br from-success-tint to-success/20",
    icon: "text-success",
  },
  indigo: {
    gradient: "bg-gradient-to-br from-white via-brand-indigo/[0.06] to-brand-indigo/[0.12]",
    glow: "after:bg-brand-indigo/20",
    chip: "bg-gradient-to-br from-brand-indigo-tint to-brand-indigo/20",
    icon: "text-brand-indigo",
  },
  amber: {
    gradient: "bg-gradient-to-br from-white via-brand-amber/[0.06] to-brand-amber/[0.12]",
    glow: "after:bg-brand-amber/20",
    chip: "bg-gradient-to-br from-brand-amber-tint to-brand-amber/20",
    icon: "text-brand-amber",
  },
  red: {
    gradient: "bg-gradient-to-br from-white via-danger/[0.06] to-danger/[0.12]",
    glow: "after:bg-danger/20",
    chip: "bg-gradient-to-br from-danger-tint to-danger/20",
    icon: "text-danger",
  },
};

function StatTile({ tile, index }: { tile: StudentStatTile; index: number }) {
  const count = useCountUp(tile.value);
  const style = TILE_STYLES[tile.iconColor] || TILE_STYLES.blue;

  return (
    <button
      onClick={tile.onClick}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`tile-stagger group relative flex flex-col gap-3 overflow-hidden p-5 text-left rounded-2xl border border-hairline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-transparent ${style.gradient}`}
    >
      <span
        className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 after:absolute after:inset-0 after:rounded-2xl after:blur-2xl ${style.glow}`}
      />
      <div className="relative z-[1] flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.chip} ${style.icon} border border-current/10 shadow-sm transition-shadow duration-300 group-hover:shadow-md`}>
          <div className="[&>svg]:size-[22px]">{tile.icon}</div>
        </div>
        {tile.liveBadge ? (
          <span className="rounded-full bg-gradient-to-r from-danger to-red-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-danger/30">
            {tile.liveBadge}
          </span>
        ) : null}
      </div>
      <div className="relative z-[1]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">
          {tile.label}
        </p>
        <p className="mt-0.5 text-4xl font-extrabold tracking-tight text-ink">
          {count}
        </p>
        {tile.trend && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate">
            <IconTrendingUp size={13} className="text-slate" />
            {tile.trend.value >= 0 ? "+" : ""}
            {tile.trend.value}% {tile.trend.label}
          </span>
        )}
      </div>
      <IconArrowRight
        size={14}
        className="absolute right-4 top-4 text-slate/40 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 z-[1]"
      />
    </button>
  );
}

export default function StudentStatTiles({
  tiles,
  className = "",
}: StudentStatTilesProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 xl:grid-cols-4 ${className}`}>
      {tiles.map((tile, idx) => (
        <StatTile key={tile.id} tile={tile} index={idx} />
      ))}
    </div>
  );
}
