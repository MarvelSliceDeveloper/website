"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight } from "@tabler/icons-react";

export interface StudentStatTile {
    id: string;
    label: string;
    value: number;
    icon: React.ReactNode;
    onClick: () => void;
    gradient: string;
    liveBadge?: string;
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

// Single stat tile with count-up animation
function StatTile({ tile }: { tile: StudentStatTile }) {
    const count = useCountUp(tile.value);

    return (
        <button
            onClick={tile.onClick}
            className="glass-card group relative flex flex-col gap-3 overflow-hidden p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
        >
            <div className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${tile.gradient}`} />
            <div className="relative flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-md">
                    {tile.icon}
                </div>
                {tile.liveBadge ? (
                    <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                        {tile.liveBadge}
                    </span>
                ) : null}
            </div>
            <div className="relative">
                <p className="sp-eyebrow">{tile.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{count}</p>
            </div>
            <IconArrowRight
                size={14}
                className="absolute right-4 top-4 text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
            />
        </button>
    );
}

// Grid of stat tiles with count-up animations
export default function StudentStatTiles({ tiles, className = "" }: StudentStatTilesProps) {
    return (
        <div className={`grid grid-cols-2 gap-3 xl:grid-cols-4 ${className}`}>
            {tiles.map((tile) => (
                <StatTile key={tile.id} tile={tile} />
            ))}
        </div>
    );
}
