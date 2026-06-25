interface SkeletonProps {
  className?: string;
  lines?: number;
}

// Animated loading placeholder with optional multi-line mode
export function Skeleton({ className = "", lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={`h-4 rounded bg-card-hover ${i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"} ${className}`} />
        ))}
      </div>
    );
  }

  return <div className={`animate-pulse rounded bg-card-hover ${className}`} />;
}
