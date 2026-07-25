"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export default class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (SENTRY_DSN) {
      import("@sentry/react")
        .then((Sentry) => {
          Sentry.captureException(error, {
            extra: { componentStack: info.componentStack },
          });
        })
        .catch(() => {
          // silent
        });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/5 p-8 text-center">
            <div className="text-3xl">⚠</div>
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
