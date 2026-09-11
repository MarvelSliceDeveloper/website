interface LoadingPageProps {
  /** Text under the spinner. Defaults to "Loading...". */
  message?: string;
  /**
   * Center in the full viewport (min-h-svh) instead of the default
   * segment height (min-h-[60vh]). Use for top-level / auth routes
   * and Suspense fallbacks that replace the whole screen.
   */
  fullScreen?: boolean;
}

export default function LoadingPage({
  message = "Loading...",
  fullScreen = false,
}: LoadingPageProps) {
  return (
    <div
      className={`flex w-full items-center justify-center ${
        fullScreen ? "min-h-svh bg-background" : "min-h-[60vh]"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
