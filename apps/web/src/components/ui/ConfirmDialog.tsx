"use client";

import { useCallback, useContext, createContext, useState } from "react";
import type { ReactNode } from "react";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

export interface ConfirmDialogOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When false, uses neutral (primary) styling instead of danger red. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn>(() =>
  Promise.resolve(false),
);

/** Returns a promise-based confirm function. Resolves `true` if confirmed. */
export function useConfirmDialog(): ConfirmFn {
  return useContext(ConfirmDialogContext);
}

interface DialogState extends ConfirmDialogOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close(false);
  };

  const danger = state?.danger !== false;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={state.title ?? "Confirm"}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
          onKeyDown={handleKeyDown}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-5 pt-5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  danger
                    ? "bg-danger/10 text-danger"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <IconAlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground">
                  {state.title ?? "Are you sure?"}
                </h3>
                <div className="mt-1 text-sm text-muted-foreground">
                  {state.message}
                </div>
              </div>
              <button
                onClick={() => close(false)}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-muted/20 hover:text-foreground"
                aria-label="Close dialog"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                onClick={() => close(false)}
                className="btn-secondary text-sm px-3.5 py-1.5"
              >
                {state.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={() => close(true)}
                className={
                  danger
                    ? "btn-danger text-sm px-3.5 py-1.5"
                    : "btn-primary text-sm px-3.5 py-1.5"
                }
              >
                {state.confirmLabel ?? (danger ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
