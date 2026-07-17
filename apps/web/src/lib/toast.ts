"use client";

import { toast as sonnerToast } from "sonner";
import { formatApiErrorMessage } from "@/lib/api";

type SonnerToast = typeof sonnerToast;

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const err = error as {
      response?: { data?: unknown; status?: number };
    };
    return formatApiErrorMessage(err.response?.data, err.response?.status);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

export const toast: SonnerToast = sonnerToast;
