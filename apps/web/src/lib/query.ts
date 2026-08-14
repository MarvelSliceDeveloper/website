"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, Error>,
  "queryKey" | "queryFn"
>;

/**
 * Typed TanStack Query wrapper over the app's `api` client.
 *
 * Defaults (staleTime / retry / refetchOnWindowFocus) come from the
 * QueryClient configured in `app/providers.tsx`; per-call `options` win.
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  params?: Record<string, string>,
  options?: ApiQueryOptions<T>,
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: () => api.get<T>(endpoint, params),
    ...options,
  });
}