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

/**
 * Runs an async task while showing a loading toast, then replaces it with a
 * success or error toast once the task settles.
 *
 * The `success` callback returns the success message (or a
 * `{ message, type }` object to control success vs error styling), or nothing
 * to dismiss the toast.
 *
 * @example
 * await withLoadingToast(
 *   api.post(`/api/admin/courses/${id}/publish`),
 *   { loading: "Publishing course...", success: () => "Course published" },
 * );
 */
export async function withLoadingToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: (
      data: T,
    ) => string | { message: string; type?: "success" | "error" } | void;
    error?: (err: unknown) => string;
  },
): Promise<T> {
  const id = sonnerToast.loading(messages.loading);
  try {
    const data = await promise;
    const result = messages.success(data);
    if (typeof result === "string") {
      sonnerToast.success(result, { id });
    } else if (result && typeof result === "object") {
      const { message, type } = result;
      if (type === "error") sonnerToast.error(message, { id });
      else sonnerToast.success(message, { id });
    } else {
      sonnerToast.dismiss(id);
    }
    return data;
  } catch (err: unknown) {
    const errorMsg = messages.error
      ? messages.error(err)
      : getErrorMessage(err);
    sonnerToast.error(errorMsg, { id });
    throw err;
  }
}
