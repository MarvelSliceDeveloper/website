import { getTokenForUser, refreshMsTokenForUser, getAppToken } from './graph.auth';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

export class GraphError extends Error {
  public statusCode: number;
  public graphErrorCode: string;

  constructor(statusCode: number, graphErrorCode: string, message: string) {
    super(message);
    this.name = 'GraphError';
    this.statusCode = statusCode;
    this.graphErrorCode = graphErrorCode;
  }
}

function mapGraphError(statusCode: number, data: any): GraphError {
  const code = data?.error?.code || 'UnknownError';
  const rawMessage = data?.error?.message || 'An unknown error occurred with Microsoft Graph';
  
  // Log the raw error for debugging
  console.error(`[GraphAPI] Error ${statusCode} (${code}): ${rawMessage}`);

  // Friendly messages for known errors
  let friendlyMessage = rawMessage;
  switch (code) {
    case 'InvalidAuthenticationToken':
      friendlyMessage = 'Your Microsoft session has expired. Please sign in again.';
      break;
    case 'ResourceNotFound':
      friendlyMessage = 'The requested Microsoft resource could not be found.';
      break;
    case 'ErrorAccessDenied':
      friendlyMessage = 'You do not have permission to perform this action in Microsoft Teams/Calendar.';
      break;
    case 'MailboxNotEnabledForRESTAPI':
      friendlyMessage = 'Your Microsoft account mailbox is not enabled for the REST API.';
      break;
    case 'AuthenticationError':
      friendlyMessage = 'Microsoft authentication failed. Please re-link your Microsoft account.';
      break;
  }

  return new GraphError(statusCode, code, friendlyMessage);
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      throw new Error('GraphClient must be initialized with either a userId or useAppToken=true');
    }
    this.userId = options.userId;
    this.useAppToken = options.useAppToken;
  }

  private async getValidToken(forceRefresh = false): Promise<string> {
    if (this.useAppToken) {
      // App tokens are cached in memory or fetched every time (we can optimize caching later)
      if (!this.accessToken || forceRefresh) {
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
      }
      return this.accessToken;
    }

    throw new Error('Invalid GraphClient state');
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const maxRetries = 3;
    let attempts = 0;
    let forceRefresh = false;

    while (attempts < maxRetries) {
      attempts++;
      
      const token = await this.getValidToken(forceRefresh);
      forceRefresh = false; // reset after refreshing

      const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.ok) {
        if (response.status === 204) {
          return null as any;
        }
        return await response.json() as T;
      }

      const errorData = await response.json().catch(() => null);

      // Handle 401 Unauthorized -> Refresh token and retry
      if (response.status === 401) {
        if (attempts < maxRetries) {
          forceRefresh = true;
          continue; // Try again with a new token
        }
        // Last attempt — throw the proper mapped error
        throw mapGraphError(response.status, errorData);
      }

      // Handle 429 Too Many Requests -> Backoff
      if (response.status === 429) {
        if (attempts < maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempts) * 1000;
          await wait(delay);
          continue;
        }
        throw mapGraphError(response.status, errorData);
      }

      // Handle 503/504 Service Unavailable -> Backoff
      if (response.status === 503 || response.status === 504) {
        if (attempts < maxRetries) {
          const delay = Math.pow(2, attempts) * 1000;
          await wait(delay);
          continue;
        }
        throw mapGraphError(response.status, errorData);
      }

      // Other errors — do not retry
      throw mapGraphError(response.status, errorData);
    }

    throw new GraphError(500, 'MaxRetriesExceeded', 'Maximum retries exceeded calling Microsoft Graph API');
  }

  public get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  public post(endpoint: string, body: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public patch(endpoint: string, body: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Performs a request and returns the raw fetch Response object.
   * Useful for binary content, redirects, or custom response handling.
   */
  public async getRaw(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    const url = endpoint.startsWith('http') ? endpoint : `${GRAPH_BASE_URL}${endpoint}`;
    
    return fetch(url, {
      ...options,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }
}
