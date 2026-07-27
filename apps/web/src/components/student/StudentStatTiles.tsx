"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconTrendingUp } from "@tabler/icons-react";

export interface StudentStatTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
  iconColor: "blue" | "orange" | "green";
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

const CHIP_STYLES: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-brand-blue-tint", icon: "text-brand-blue" },
  orange: { bg: "bg-brand-orange-tint", icon: "text-brand-orange" },
  green: { bg: "bg-success-tint", icon: "text-success" },
};

function StatTile({ tile }: { tile: StudentStatTile }) {
  const count = useCountUp(tile.value);
  const chip = CHIP_STYLES[tile.iconColor] || CHIP_STYLES.blue;

  return (
    <button
      onClick={tile.onClick}
      className="group relative flex flex-col gap-3 overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-1 rounded-2xl bg-paper border border-hairline shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${chip.bg} ${chip.icon} border border-current/10`}>
          <div className="[&>svg]:size-[22px]">{tile.icon}</div>
        </div>
        {tile.liveBadge ? (
          <span className="rounded-full bg-danger px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {tile.liveBadge}
          </span>
        ) : null}
      </div>
      <div>
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
        className="absolute right-4 top-4 text-slate/40 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
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
      {tiles.map((tile) => (
        <StatTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
