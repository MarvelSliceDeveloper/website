"use client";

import { Toaster } from "sonner";
import SentryProvider from "@/components/SentryProvider";
import SentryErrorBoundary from "@/components/SentryErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SentryProvider>
      <SentryErrorBoundary>
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand
          toastOptions={{
            duration: 4000,
          }}
        />
        {children}
      </SentryErrorBoundary>
    </SentryProvider>
  );
}
