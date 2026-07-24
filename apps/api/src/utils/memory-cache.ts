const cache = new Map<string, { data: unknown; expiry: number }>();

const DEFAULT_TTL_MS = 30_000;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(
  key: string,
  data: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
  // Evict old entries if map grows too large
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiry) cache.delete(k);
    }
  }
}
