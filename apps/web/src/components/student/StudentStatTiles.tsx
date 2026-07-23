"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconTrendingUp } from "@tabler/icons-react";

export interface StudentStatTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
  gradient: string;
  liveBadge?: string;
  trend?: { value: number; label: string };
  iconColor?: string;
}

interface StudentStatTilesProps {
  tiles: StudentStatTile[];
  className?: string;
}

// Animate a number from 0 to target over a duration
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

const GRADIENT_STYLES: Record<string, string> = {
  primary:
    "from-teal-500 to-cyan-600 shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:from-teal-400 hover:to-cyan-500",
  danger:
    "from-rose-500 to-pink-600 shadow-rose-500/20 hover:shadow-rose-500/30 hover:from-rose-400 hover:to-pink-500",
  accent:
    "from-violet-500 to-purple-600 shadow-violet-500/20 hover:shadow-violet-500/30 hover:from-violet-400 hover:to-purple-500",
  success:
    "from-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-400 hover:to-indigo-500",
};

// Single stat tile with count-up animation
function StatTile({ tile }: { tile: StudentStatTile }) {
  const count = useCountUp(tile.value);
  const grad = tile.iconColor
    ? GRADIENT_STYLES[tile.iconColor] || GRADIENT_STYLES.primary
    : GRADIENT_STYLES.primary;

  return (
    <button
      onClick={tile.onClick}
      className={`group relative flex flex-col gap-3 overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-1 rounded-2xl shadow-lg border border-white/10 bg-gradient-to-r ${grad}`}
    >
      {/* Decorative inner blur elements */}
      <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-white/5 blur-lg" />

      <div className="relative flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white border border-white/20 shadow-sm">
          <div className="[&>svg]:size-[22px]">{tile.icon}</div>
        </div>
        {tile.liveBadge ? (
          <span className="rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {tile.liveBadge}
          </span>
        ) : null}
      </div>
      <div className="relative text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {tile.label}
        </p>
        <p className="mt-0.5 text-4xl font-extrabold tracking-tight text-white">
          {count}
        </p>
        {tile.trend && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-white/80">
            <IconTrendingUp size={13} className="text-white/70" />
            {tile.trend.value >= 0 ? "+" : ""}
            {tile.trend.value}% {tile.trend.label}
          </span>
        )}
      </div>
      <IconArrowRight
        size={14}
        className="absolute right-4 top-4 text-white/60 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
      />
    </button>
  );
}

// Grid of stat tiles with count-up animations
export default function StudentStatTiles({
  tiles,
  className = "",
}: StudentStatTilesProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 xl:grid-cols-4 ${className}`}>
      {tiles.map((tile) => (
        <StatTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
