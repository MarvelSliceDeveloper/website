import { getCached, setCache } from "./memory-cache";

// Single-flight (promise memoization) layer on top of memory-cache.
//
// When a key expires, concurrent requests that miss the cache all call the
// expensive fetcher (e.g. the course-content query). This map collapses those
// concurrent misses into a single in-flight DB call: the first request starts
// the fetch, the rest await the same promise. On success the result is written
// to the cache and the entry is removed; on failure the entry is removed so a
// retry can run again.
const inflight = new Map<string, Promise<unknown>>();

export async function getCachedSingleFlight<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000,
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  void promise.then((data) => {
    setCache(key, data, ttlMs);
    inflight.delete(key);
  });
  return promise;
}
