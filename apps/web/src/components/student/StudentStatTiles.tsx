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

const TILE_GRADIENTS: Record<string, { from: string; to: string }> = {
  blue: { from: "#2563EB", to: "#4F46E5" },
  orange: { from: "#FB923C", to: "#F87171" },
  green: { from: "#14B8A6", to: "#22C55E" },
  indigo: { from: "#6366F1", to: "#8B5CF6" },
  amber: { from: "#F59E0B", to: "#F97316" },
  red: { from: "#EC4899", to: "#EF4444" },
};

function StatTile({ tile, index }: { tile: StudentStatTile; index: number }) {
  const count = useCountUp(tile.value);
  const gradient = TILE_GRADIENTS[tile.iconColor] ?? TILE_GRADIENTS.blue;

  return (
    <button
      onClick={tile.onClick}
      style={{
        animationDelay: `${index * 80}ms`,
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        boxShadow: "0 12px 24px -10px rgba(0,0,0,.25)",
      }}
      className="tile-stagger group relative flex flex-col gap-3 overflow-hidden rounded-[18px] p-5 text-left text-white transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Decorative translucent circles, clipped to the card */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          top: -48,
          right: -48,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.14)",
          top: 24,
          right: 52,
        }}
      />
      <div className="relative z-[1] flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-sm">
          <div className="[&>svg]:size-[22px]">{tile.icon}</div>
        </div>
        {tile.liveBadge ? (
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {tile.liveBadge}
          </span>
        ) : null}
      </div>
      <div className="relative z-[1]">
        <p className="text-xs font-bold uppercase tracking-wider text-white/85">
          {tile.label}
        </p>
        <p className="mt-0.5 text-4xl font-extrabold tracking-tight">
          {count}
        </p>
      </div>
      <IconArrowRight
        size={14}
        className="absolute right-4 top-4 z-[1] text-white opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
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
