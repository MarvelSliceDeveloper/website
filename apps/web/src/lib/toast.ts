"use client";

import { toast as sonnerToast } from "sonner";
import { formatApiErrorMessage } from "@/lib/api";

type SonnerToast = typeof sonnerToast;

type ToastOptions = {
  className?: string;
  closeButton?: boolean;
  descriptionClassName?: string;
  style?: React.CSSProperties;
  cancelButtonStyle?: React.CSSProperties;
  actionButtonStyle?: React.CSSProperties;
  duration?: number;
  unstyled?: boolean;
  classNames?: Record<string, string>;
  closeButtonAriaLabel?: string;
  toasterId?: string;
};

type PromiseMessages<Data> = {
  loading?: string;
  success?: string | ((data: Data) => string);
  error?: string | ((error: unknown) => string);
  finally?: () => void;
};

const defaultOptions: ToastOptions = {
  duration: 4000,
};

export function showSuccess(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, { ...defaultOptions, ...options });
}

export function showError(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, { ...defaultOptions, ...options });
}

export function showInfo(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, { ...defaultOptions, ...options });
}

export function showWarning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, { ...defaultOptions, ...options });
}

export function showLoading(message: string, options?: ToastOptions) {
  return sonnerToast.loading(message, { ...defaultOptions, ...options });
}

export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

export function showPromise<Data>(
  promise: Promise<Data> | (() => Promise<Data>),
  messages: PromiseMessages<Data>,
) {
  return sonnerToast.promise(promise, messages);
}

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
