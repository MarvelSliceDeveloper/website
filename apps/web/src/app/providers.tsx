"use client";

import { useState } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import SentryProvider from "@/components/SentryProvider";
import SentryErrorBoundary from "@/components/SentryErrorBoundary";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

// Redirect to login when the session expires (API returns 401). This replaces
// per-page `router.push("/login")` checks on auth failures.
function isUnauthorized(error: unknown): boolean {
  const res = (
    error as {
      response?: { status?: number };
    }
  ).response;
  return res?.status === 401;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (isUnauthorized(error)) {
              window.location.href = "/login";
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
