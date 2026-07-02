"use client";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="glass-card overflow-hidden p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 flex-1 animate-pulse bg-card-hover rounded-md mx-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 4 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="h-11 w-11 rounded-xl animate-pulse bg-card-hover" />
          <div className="h-3 w-24 animate-pulse bg-card-hover rounded" />
          <div className="h-8 w-16 animate-pulse bg-card-hover rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 280 }: ChartSkeletonProps) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="h-4 w-40 animate-pulse bg-card-hover rounded" />
      <div className="w-full animate-pulse bg-card-hover rounded-lg" style={{ height: `${height}px` }} />
    </div>
  );
}
