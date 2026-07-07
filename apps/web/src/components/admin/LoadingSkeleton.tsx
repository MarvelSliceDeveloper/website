"use client";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="border border-border bg-card overflow-hidden p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 flex-1 animate-pulse bg-border mx-1"
            />
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
        <div key={i} className="border border-border bg-card p-4 space-y-3">
          <div className="h-10 w-10 animate-pulse bg-border" />
          <div className="h-3 w-24 animate-pulse bg-border" />
          <div className="h-7 w-16 animate-pulse bg-border mt-2" />
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
    <div className="border border-border bg-card p-5 space-y-4">
      <div className="h-4 w-40 animate-pulse bg-border" />
      <div
        className="w-full animate-pulse bg-border"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
