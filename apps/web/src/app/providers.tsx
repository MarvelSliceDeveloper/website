"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
