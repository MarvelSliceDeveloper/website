# Redis Integration Plan

## Why Redis Is Needed

### Problems With Current Approach

1. **No shared cache across API instances** — The in-memory cache (`memory-cache.ts`) lives inside a single Node process. If the API scales to multiple workers or instances (via PM2 cluster or multiple containers), each instance has its own isolated cache. A cache write on instance A is invisible to instance B.

2. **In-memory cache lost on restart** — Every API restart wipes the in-memory cache. Redis persists to disk.

3. **No cache invalidation mechanism** — When an admin edits a course, there's no way to tell all API instances to purge stale course content. With Redis, we can publish invalidation events.

4. **Rate limiting** — The API uses `express-rate-limit` with in-memory storage. Under load, rate limits reset on restart and don't work across instances. Redis-backed rate limiting is the standard approach for production deployments.

5. **Session/csrf token store** — Currently, CSRF tokens are fetched per-request with no server-side verification. Redis could store CSRF tokens for verification and TTL-based expiry.

6. **Background job queue** — Future needs like email queues, certificate generation batches, or recording sync tasks need a Redis-backed job queue (Bull/BullMQ).

### Comparison: In-Memory vs Redis

| Aspect | In-Memory (Current) | Redis |
|--------|-------------------|-------|
| Persistence | Lost on restart | Disk-persisted (RDB/AOF) |
| Multi-instance | Isolated per process | Shared across all instances |
| Max cache size | ~500 entries (auto-evict) | Configurable, GB-scale |
| TTL expiry | Map-based manual check | Native EXPIRE/TTL commands |
| Invalidation | Not supported | PUB/SUB for cross-instance events |
| Rate limiting | Not possible across instances | Atomic INCR + EXPIRE |
| Data structures | Plain Map | Strings, Hashes, Sets, Sorted Sets |

## Integration Plan

### Phase 1: Redis Client Setup (1 day)

1. **Install `ioredis`** — the de facto Redis client for Node.js:
   ```
   pnpm add ioredis -F @lms/api
   ```

2. **Create Redis client module** at `apps/api/src/utils/redis.ts`:
   ```typescript
   import Redis from "ioredis";

   const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

   declare global {
     var redis: Redis | undefined;
   }

   export const redis = global.redis || new Redis(REDIS_URL, {
     maxRetriesPerRequest: 3,
     retryStrategy: (times) => Math.min(times * 200, 3000),
     lazyConnect: true, // don't block startup
   });

   if (process.env.NODE_ENV !== "production") global.redis = redis;
   ```

3. **Lazy-connect on first use** — the `lazyConnect: true` option means the connection is established on the first command. This avoids blocking API startup if Redis is temporarily down.

4. **Health check endpoint** — Update `GET /api/admin/cache/status` to ping Redis and report actual connection status.

### Phase 2: Replace In-Memory Cache With Redis (1-2 days)

1. **Create Redis cache utility** at `apps/api/src/utils/redis-cache.ts`:
   ```typescript
   import { redis } from "./redis";

   const DEFAULT_TTL_SEC = 30;

   export async function getCached<T>(key: string): Promise<T | null> {
     const raw = await redis.get(key);
     return raw ? JSON.parse(raw) as T : null;
   }

   export async function setCache<T>(key: string, data: T, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
     await redis.setex(key, ttlSec, JSON.stringify(data));
   }

   export async function delCache(pattern: string): Promise<void> {
     const keys = await redis.keys(pattern);
     if (keys.length) await redis.del(...keys);
   }
   ```

2. **Replace `memory-cache.ts` usage** in `student-course.routes.ts`:
   - Import from `redis-cache` instead of `memory-cache`
   - Same API surface (`getCached`/`setCache`), so the change is a 1-line import swap

3. **Update TTLs strategically**:
   | Endpoint | TTL | Rationale |
   |----------|-----|-----------|
   | `GET /api/courses/:courseId/content` | 30s | Course structure is static; progress data changes |
   | `GET /api/courses/catalogue` | 60s | Published courses change infrequently |
   | `GET /api/notifications` | 10s | Notifications should feel real-time |
   | `GET /api/admin/batches` | 15s | Admin data freshness important |

### Phase 3: Cache Invalidation (1 day)

1. **PUB/SUB channel for invalidation** — When an admin modifies course structure, publish an invalidation event:
   ```typescript
   // After course update in course.service.ts
   await redis.publish("cache:invalidate", JSON.stringify({
     pattern: `content:*:${courseId}:*`
   }));
   ```

2. **Subscribe in a background listener** — At API startup, subscribe to the invalidation channel:
   ```typescript
   const subscriber = redis.duplicate();
   subscriber.subscribe("cache:invalidate");
   subscriber.on("message", (channel, message) => {
     const { pattern } = JSON.parse(message);
     // Delete all matching keys
   });
   ```

3. **Invalidation triggers**:
   | Action | Pattern to invalidate |
   |--------|----------------------|
   | Course edited (title, desc, thumbnail) | `content:*:{courseId}:*` |
   | Module added/removed/reordered | `content:*:{courseId}:*` |
   | Lesson added/edited/deleted | `content:*:{courseId}:*` |
   | Quiz/Assignment added/edited/deleted | `content:*:{courseId}:*` |
   | Batch created/updated | `batches:*` |
   | Notification sent | `notifications:{userId}` |

### Phase 4: Redis-Backed Rate Limiting (1 day)

1. **Replace `express-rate-limit`'s default memory store** with a Redis store.

2. **Install `rate-limit-redis`**:
   ```
   pnpm add rate-limit-redis -F @lms/api
   ```

3. **Update rate limiter in `app.ts`**:
   ```typescript
   import RedisStore from "rate-limit-redis";
   import { redis } from "./utils/redis";

   // Replace the default memory-based limiter
   app.use(rateLimit({
     store: new RedisStore({
       sendCommand: (...args) => redis.call(...args),
     }),
     windowMs: 60 * 1000,
     max: 100,
   }));
   ```

### Phase 5: CSRF Token Storage (Optional, 0.5 day)

Currently, CSRF tokens are fetched from `/api/csrf-token` and sent in headers, but there's no server-side verification that the token was actually issued. With Redis:

1. On `GET /api/csrf-token` — store the token in Redis with a TTL:
   ```
   SET csrf:{token} {userId or "anonymous"} EX 3600
   ```

2. On state-changing requests — verify the token exists in Redis before processing:
   ```typescript
   const valid = await redis.exists(`csrf:${token}`);
   if (!valid) return res.status(403).json({ error: "Invalid CSRF token" });
   ```

## Expected Results

### Performance Improvements

| Metric | Before (In-Memory) | After (Redis) | Why |
|--------|-------------------|---------------|-----|
| Course content response time | ~50-200ms (DB) | ~1-5ms (cache hit) | 10-40x faster on cache hit |
| Cache hit ratio | ~30% (per-instance, lost on restart) | ~70% (shared, persistent) | Cross-instance sharing + restart survival |
| Rate limiting accuracy | ✗ Resets on restart | ✓ Atomic counters across instances | Redis INCR is atomic |
| Cache invalidation | ✗ Not possible | ✓ Cross-instance PUB/SUB | Instant propagation |

### Architectural Benefits

- **Horizontal scaling ready** — Add more API instances; Redis handles cache sharing automatically
- **Background job queue ready** — Redis is the foundation for Bull/BullMQ job queues (email sending, certificate generation, recording sync)
- **Session store ready** — If session-based auth is needed later, Redis `connect-redis` is the standard
- **Reduced DB load** — Course structure data served from Redis instead of hitting Postgres on every request

### Estimated DB Query Reduction

| Endpoint | Queries/Request | Cache TTL | Est. Daily Requests | DB Queries Saved/Day |
|----------|----------------|-----------|---------------------|---------------------|
| Course content | 5 queries | 30s | 10,000 | ~45,000 (90% hit rate) |
| Course catalogue | 3 queries | 60s | 5,000 | ~14,700 (98% hit rate) |
| Notifications | 2 queries | 10s | 50,000 | ~90,000 (90% hit rate) |
| **Total** | | | | **~150,000 fewer DB queries/day** |

### Implementation Order (Priority)

1. Phase 1 (Redis client + connection) — **Day 1 morning**
2. Phase 2 (Replace memory cache) — **Day 1 afternoon**
3. Phase 3 (Cache invalidation) — **Day 2 morning**
4. Phase 4 (Rate limiting) — **Day 2 afternoon**
5. Phase 5 (CSRF tokens) — **Optional, Day 3**

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Redis connection failure | Low (local docker) | `lazyConnect: true`, graceful fallback to DB |
| Memory leak from unbounded cache keys | Medium | Set TTL on every key; monitor `INFO keyspace` |
| Cache stampede on key expiry | Low | Use `SET NX` + staggered TTL for hot keys |
| Stale data served after edit | Low | PUB/SUB invalidation on admin actions |
| Redis single point of failure | Medium | Docker restart policy; Redis Sentinel for HA |
