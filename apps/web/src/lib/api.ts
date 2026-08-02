const API_BASE = "";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Converts a Zod issues array into a readable, field-level message.
function describeIssues(issues: unknown): string {
  if (!Array.isArray(issues) || issues.length === 0) return "Validation failed";
  return (issues as Array<{ path?: (string | number)[]; message?: string }>)
    .map((i) => {
      const field =
        Array.isArray(i?.path) && i.path.length ? i.path.join(".") : "field";
      return `${field}: ${i?.message ?? "invalid"}`;
    })
    .join("; ");
}

// Produces a human-readable error message from an API error body.
export function formatApiErrorMessage(body: unknown, status?: number): string {
  if (body == null) return `Request failed${status ? ` (${status})` : ""}`;
  const b = body as {
    error?: unknown;
    details?: unknown;
    message?: unknown;
  };
  if (Array.isArray(b.error)) return describeIssues(b.error);
  if (typeof b.error === "string" && b.error) return b.error;
  if (Array.isArray(b.details)) return describeIssues(b.details);
  if (typeof b.details === "string" && b.details) return b.details;
  if (typeof b.message === "string" && b.message) return b.message;
  return `Request failed${status ? ` (${status})` : ""}`;
}

let csrfTokenPromise: Promise<string> | null = null;
let csrfRefreshing = false;
let csrfRetryCount = 0;

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/csrf-token`, {
    credentials: "include",
  });
  const data = await res.json();
  return data.csrfToken;
}

function getCsrfToken(forceRefresh = false): Promise<string> {
  // forceRefresh is used on a 403 retry: bypass the cached (stale) token but
  // still dedupe concurrent refreshes so a burst of 403s triggers a single
  // /api/csrf-token fetch instead of N parallel ones.
  if (!csrfTokenPromise || (forceRefresh && !csrfRefreshing)) {
    csrfRefreshing = true;
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfRefreshing = false;
    });
  }
  return csrfTokenPromise;
}

async function request<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(
    (fetchOptions.method || "GET").toUpperCase(),
  );

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (isStateChanging) {
    const token = await getCsrfToken();
    headers["x-csrf-token"] = token;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  // If 403 (CSRF likely), refresh token and retry once
  if (res.status === 403 && isStateChanging && csrfRetryCount === 0) {
    csrfRetryCount++;
    csrfTokenPromise = null; // clear stale token
    const newToken = await getCsrfToken(true);
    headers["x-csrf-token"] = newToken;
    const retryRes = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers,
    });
    csrfRetryCount = 0;
    if (!retryRes.ok) {
      const errorBody = await retryRes
        .json()
        .catch(() => ({ error: retryRes.statusText }));
      const message = formatApiErrorMessage(errorBody, retryRes.status);
      const err = new Error(message) as Error & {
        response?: { data: unknown; status: number };
      };
      err.response = {
        data: errorBody ?? { error: retryRes.statusText },
        status: retryRes.status,
      };
      throw err;
    }
    if (retryRes.status === 204) return null as T;
    return retryRes.json();
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    const message = formatApiErrorMessage(errorBody, res.status);
    const err = new Error(message) as Error & {
      response?: { data: unknown; status: number };
    };
    err.response = {
      data: errorBody ?? { error: res.statusText },
      status: res.status,
    };
    throw err;
  }

  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  // GET request
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", params }),
  // POST request
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  // PUT request
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  // PATCH request
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  // DELETE request
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
