// Badge indicating a live-now session with pulsing dot
export function LiveBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dotSize = size === "lg" ? "h-3 w-3" : "h-2 w-2";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 ${textSize} font-semibold text-success`}
    >
      <span className={`${dotSize} rounded-full bg-success live-pulse`} />
      Live Now
    </span>
  );
}

// Badge showing session status with color coding
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-primary/15 text-primary-hover",
    live: "bg-success/15 text-success",
    completed: "bg-muted/20 text-muted-foreground",
    cancelled: "bg-danger/15 text-danger",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.scheduled}`}
    >
      {status === "live" && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-success live-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
