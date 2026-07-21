"use client";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-semibold text-foreground">Something went wrong</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-primary text-sm">
        Try again
      </button>
    </div>
  );
}
