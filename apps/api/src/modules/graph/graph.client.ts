import {
  getTokenForUser,
  refreshMsTokenForUser,
  getAppToken,
  isTokenExpiringSoon,
} from "./graph.auth";
import { prisma } from "../../utils/prisma";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

export class GraphError extends Error {
  public statusCode: number;
  public graphErrorCode: string;

  constructor(statusCode: number, graphErrorCode: string, message: string) {
    super(message);
    this.name = "GraphError";
    this.statusCode = statusCode;
    this.graphErrorCode = graphErrorCode;
  }
}

function mapGraphError(statusCode: number, data: any): GraphError {
  const code = data?.error?.code || "UnknownError";
  const rawMessage =
    data?.error?.message || "An unknown error occurred with Microsoft Graph";

  // Log the raw error for debugging
  console.error(`[GraphAPI] Error ${statusCode} (${code}): ${rawMessage}`);

  // Friendly messages for known errors
  let friendlyMessage = rawMessage;
  switch (code) {
    case "InvalidAuthenticationToken":
      friendlyMessage =
        "Your Microsoft session has expired. Please sign in again.";
      break;
    case "ResourceNotFound":
      friendlyMessage = "The requested Microsoft resource could not be found.";
      break;
    case "ErrorAccessDenied":
      friendlyMessage =
        "You do not have permission to perform this action in Microsoft Teams/Calendar.";
      break;
    case "MailboxNotEnabledForRESTAPI":
      friendlyMessage =
        "Your Microsoft account mailbox is not enabled for the REST API.";
      break;
    case "AuthenticationError":
      if (rawMessage.includes("Error authenticating with resource")) {
        friendlyMessage =
          'Your Microsoft account cannot create Teams meetings. This usually means: (1) Your account lacks a Microsoft Teams license, or (2) the Azure AD admin hasn\'t granted consent for "OnlineMeetings.ReadWrite" in the Azure Portal → App registrations → API Permissions.';
      } else {
        friendlyMessage =
          "Microsoft authentication failed. Please re-link your Microsoft account.";
      }
      break;
  }

  // "No authorization information present on the request" usually means the token
  // is empty, malformed, or the Azure AD app lacks admin-consented permissions.
  if (rawMessage.includes("No authorization information")) {
    friendlyMessage =
      'Microsoft Graph authentication failed. Please ensure: (1) Your Microsoft account is re-linked in Settings, and (2) an Azure AD admin has granted consent for "OnlineMeetingRecording.Read.All" in the Azure Portal.';
  }

  return new GraphError(statusCode, code, friendlyMessage);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ACTION_MAP: Record<string, string> = {
  "/me/onlineMeetings": "createOnlineMeeting",
  "/onlineMeetings": "getOnlineMeeting",
  "/me/events": "getCalendarView",
  "/events": "getCalendarView",
  "/me/calendar": "getCalendarEvents",
  "/users": "getMsUserProfile",
  "/me": "getMsUserProfile",
  "/subscriptions": "createSubscription",
};

function inferAction(endpoint: string): string {
  const clean = endpoint.replace(GRAPH_BASE_URL, "").split("?")[0];
  for (const [pattern, action] of Object.entries(ACTION_MAP)) {
    if (clean.includes(pattern)) return action;
  }
  return `request_${clean.replace(/[/]/g, "_")}`;
}

async function logGraphApi(
  userId: string | undefined,
  endpoint: string,
  options: RequestInit,
  statusCode: number | null,
  errorMsg: string | null,
  startMs: number,
) {
  if (!userId) return;
  const durationMs = Date.now() - startMs;
  try {
    await prisma.graphApiLog.create({
      data: {
        userId,
        action: inferAction(endpoint),
        endpoint: `${options.method || "GET"} ${endpoint.replace(GRAPH_BASE_URL, "")}`,
        statusCode,
        success: statusCode !== null && statusCode < 400,
        errorMsg,
        durationMs,
      },
    });
  } catch {
    // silently fail — logging should never break the main flow
  }
}

interface GraphClientOptions {
  userId?: string; // if provided, uses delegated permissions
  useAppToken?: boolean; // if true, uses application permissions
}

export class GraphClient {
  private userId?: string;
  private useAppToken?: boolean;
  private accessToken: string | null = null;

  constructor(options: GraphClientOptions) {
    if (!options.userId && !options.useAppToken) {
      throw new Error(
        "GraphClient must be initialized with either a userId or useAppToken=true",
      );
    }
    this.userId = options.userId;
    this.useAppToken = options.useAppToken;
  }

  private async getValidToken(forceRefresh = false): Promise<string> {
    if (this.useAppToken) {
      // App tokens are cached in-memory (and shared via getAppToken's own
      // module-level cache). Only re-fetch when missing or about to expire.
      if (
        !this.accessToken ||
        forceRefresh ||
        isTokenExpiringSoon(this.accessToken)
      ) {
        this.accessToken = await getAppToken();
      }
      return this.accessToken;
    }

    if (this.userId) {
      if (forceRefresh) {
        this.accessToken = await refreshMsTokenForUser(this.userId);
        return this.accessToken;
      }
      if (!this.accessToken) {
        this.accessToken = await getTokenForUser(this.userId);
        // The stored token may be stale — refresh proactively so we don't
        // burn a request on a guaranteed 401.
        if (isTokenExpiringSoon(this.accessToken)) {
          this.accessToken = await refreshMsTokenForUser(this.userId);
        }
      }
      return this.accessToken;
    }

    throw new Error("Invalid GraphClient state");
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const maxRetries = 3;
    let attempts = 0;
    let forceRefresh = false;
    const startMs = Date.now();

    while (attempts < maxRetries) {
      attempts++;

      const token = await this.getValidToken(forceRefresh);
      forceRefresh = false;

      const url = endpoint.startsWith("http")
        ? endpoint
        : `${GRAPH_BASE_URL}${endpoint}`;

      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== "graph.microsoft.com") {
        throw new GraphError(
          400,
          "InvalidEndpoint",
          "Only Microsoft Graph endpoints are allowed",
        );
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.ok) {
        if (response.status === 204) {
          logGraphApi(this.userId, endpoint, options, 204, null, startMs);
          return null as any;
        }
        const result = (await response.json()) as T;
        logGraphApi(
          this.userId,
          endpoint,
          options,
          response.status,
          null,
          startMs,
        );
        return result;
      }

      const errorData = await response.json().catch(() => null);

      // Handle 401 Unauthorized -> Refresh token and retry
      if (response.status === 401) {
        if (attempts < maxRetries) {
          forceRefresh = true;
          continue;
        }
        const err = mapGraphError(response.status, errorData);
        logGraphApi(
          this.userId,
          endpoint,
          options,
          response.status,
          err.message,
          startMs,
        );
        throw err;
      }

      // Handle 429 Too Many Requests -> Backoff
      if (response.status === 429) {
        if (attempts < maxRetries) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.pow(2, attempts) * 1000;
          await wait(delay);
          continue;
        }
        const err = mapGraphError(response.status, errorData);
        logGraphApi(
          this.userId,
          endpoint,
          options,
          response.status,
          err.message,
          startMs,
        );
        throw err;
      }

      // Handle 503/504 Service Unavailable -> Backoff
      if (response.status === 503 || response.status === 504) {
        if (attempts < maxRetries) {
          const delay = Math.pow(2, attempts) * 1000;
          await wait(delay);
          continue;
        }
        const err = mapGraphError(response.status, errorData);
        logGraphApi(
          this.userId,
          endpoint,
          options,
          response.status,
          err.message,
          startMs,
        );
        throw err;
      }

      // Other errors — do not retry
      const err = mapGraphError(response.status, errorData);
      logGraphApi(
        this.userId,
        endpoint,
        options,
        response.status,
        err.message,
        startMs,
      );
      throw err;
    }

    const err = new GraphError(
      500,
      "MaxRetriesExceeded",
      "Maximum retries exceeded calling Microsoft Graph API",
    );
    logGraphApi(this.userId, endpoint, options, 500, err.message, startMs);
    throw err;
  }

  public get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  public post(endpoint: string, body: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  public patch(endpoint: string, body: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  public delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * Performs a request and returns the raw fetch Response object.
   * Useful for binary content, redirects, or custom response handling.
   */
  public async getRaw(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = await this.getValidToken();

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${GRAPH_BASE_URL}${endpoint}`;

    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "graph.microsoft.com") {
      throw new GraphError(
        400,
        "InvalidEndpoint",
        "Only Microsoft Graph endpoints are allowed",
      );
    }

    return fetch(url, {
      ...options,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }
}
