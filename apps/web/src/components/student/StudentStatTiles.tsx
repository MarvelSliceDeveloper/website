"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight } from "@tabler/icons-react";

export interface StudentStatTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
  iconColor: "blue" | "orange" | "green" | "indigo" | "amber" | "red";
  liveBadge?: string;
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

const TILE_STYLES: Record<string, { bg: string; chip: string; icon: string }> = {
  blue: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-brand-blue)_0%,transparent_80%)]",
    chip: "bg-white",
    icon: "text-brand-blue",
  },
  orange: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-brand-amber)_0%,transparent_80%)]",
    chip: "bg-white",
    icon: "text-brand-amber",
  },
  green: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-success)_0%,transparent_80%)]",
    chip: "bg-white",
    icon: "text-success",
  },
  indigo: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-brand-indigo)_0%,transparent_80%)]",
    chip: "bg-white",
    icon: "text-brand-indigo",
  },
  amber: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-brand-amber)_0%,transparent_80%)]",
    chip: "bg-white",
    icon: "text-brand-amber",
  },
  red: {
    bg: "bg-[radial-gradient(at_bottom_right,var(--color-danger)_0%,transparent_80%)]",
    chip: "bg-white",
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
      className={`tile-stagger group relative flex flex-col gap-3 overflow-hidden p-5 text-left rounded-2xl border border-hairline bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${style.bg}`}
    >
      <div className="relative z-[1] flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.chip} shadow-sm ring-1 ring-black/5`}>
          <div className={`[&>svg]:size-[22px] ${style.icon}`}>{tile.icon}</div>
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
      </div>
      <IconArrowRight
        size={14}
        className={`absolute right-4 top-4 ${style.icon} opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 z-[1]`}
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