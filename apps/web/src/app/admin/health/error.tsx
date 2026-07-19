"use client";

export default function HealthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <span className="text-4xl">⚠️</span>
      <p className="font-semibold text-foreground">
        Failed to load health data
      </p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-primary text-sm">
        Try again
      </button>
    </div>
  );
}
