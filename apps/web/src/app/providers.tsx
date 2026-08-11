"use client";

import { Toaster } from "sonner";
import SentryProvider from "@/components/SentryProvider";
import SentryErrorBoundary from "@/components/SentryErrorBoundary";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SentryProvider>
      <SentryErrorBoundary>
        <ConfirmDialogProvider>
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
        </ConfirmDialogProvider>
      </SentryErrorBoundary>
    </SentryProvider>
  );
}
