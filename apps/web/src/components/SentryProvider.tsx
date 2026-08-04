"use client";

import { useEffect, useState, createContext, useContext } from "react";

type SentryContextValue = {
  captureError: (error: unknown) => void;
};

const SentryContext = createContext<SentryContextValue>({
  captureError: () => {},
});

export const useSentry = () => useContext(SentryContext);

export default function SentryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sentry, setSentry] = useState<SentryContextValue | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const Sentry = await import("@sentry/react");
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
          environment: process.env.NODE_ENV,
          tracesSampleRate: 0.1,
          integrations: [Sentry.browserTracingIntegration()],
        });
        if (mounted) {
          setSentry({
            captureError: (error: unknown) => {
              Sentry.captureException(error);
            },
          });
        }
      } catch {
        // Sentry unavailable — silently degrade
        if (mounted) {
          setSentry({
            captureError: () => {},
          });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = sentry ?? { captureError: () => {} };

  return (
    <SentryContext.Provider value={value}>{children}</SentryContext.Provider>
  );
}
