# Load Testing (k6)

The API is load-tested with [k6](https://k6.io). Profiles live in `apps/api/k6/`.
All write-free request mixes; the only mutation performed is `POST /api/auth/login`
(which is CSRF-exempt, so no CSRF token handling is needed).

## Profiles

| Profile      | Command                          | Shape                                                       |
| ------------ | -------------------------------- | ----------------------------------------------------------- |
| `smoke.js`   | `pnpm test:load:smoke`           | 1 VU / 10s — health + login + `/api/auth/me`                |
| `load.js`    | `pnpm test:load`                 | ramp 0→20→50 VU, 3.5 min, p95 < 1s                          |
| `scenarios.js` | `pnpm test:load:scenarios`     | role-based mix (3 admin, 5 instructor, 30 student)          |
| `heavy.js`   | `pnpm test:load:heavy`           | ramp 0→50→100 VU, 4 min                                     |
| `scale-5k.js`| `pnpm test:load:scale`           | staged ladder to `TARGET_VUS` (default 500, up to 5000)     |

Shared code: `helpers.js` (base URL, seeded users, per-VU token cache
`ensureAuth()` / `authedGet()`, thresholds).

## Scale test: seed → run → clean up

```bash
# default: 500 VU ladder, pool auto-seeded and auto-deleted
pnpm test:load:scale

# the 5000-user run
TARGET_VUS=5000 pnpm test:load:scale

# options
pnpm test:load:scale -- --count=5000       # pool size override
pnpm test:load:scale -- --keep-data        # leave the pool in the DB
pnpm test:load:scale -- --skip-seed        # pool already exists
pnpm test:load:scale -- --no-summary       # anything after -- goes to k6
```

The wrapper (`apps/api/k6/run-scale.mjs`) always runs the cleanup — on
success, on failure, and on Ctrl+C (SIGINT is forwarded to k6, then the
pool is deleted before the process exits with 130).

Standalone equivalents:

```bash
pnpm test:load:seed                                  # create the pool
pnpm test:load:seed -- --count=5000 --dry-run        # preview
pnpm test:load:seed:cleanup                          # delete the pool
pnpm test:load:5k                                    # raw k6, pool must exist
```

### Ladder shape (`scale-5k.js`)

| Stage              | 500 VU (default) | 5000 VU           |
| ------------------ | ---------------- | ----------------- |
| warm-up → 20%      | 100 for 2m+1m    | 1000 for 2m+1m    |
| → 60%              | 300 for 3m+2m    | 3000 for 3m+2m    |
| → 100% (ramp top)  | 500 in 5m        | 5000 in 5m        |
| hold 100%          | 5m               | 5m                |
| ramp down          | 2m (+60s graceful)| 2m (+60s graceful)|

Per-VU think time is a random `sleep` between `MIN_THINK` (5s) and `MAX_THINK`
(15s); requests per iteration are health, public packages, login (cached),
`/api/auth/me`, `/api/courses/enrolled`, `/api/courses/catalogue`,
`/api/sessions`, `/api/mentorship/tickets/my`.

### Knobs (environment variables)

| Var              | Default                 | Meaning                                        |
| ---------------- | ----------------------- | ---------------------------------------------- |
| `TARGET_VUS`     | `500`                   | Top of the ladder                              |
| `BASE_URL`       | `http://localhost:4000` | API under test                                 |
| `P95_MS`         | `1500`                  | Global p95 threshold                           |
| `LOAD_USER_COUNT`| = `TARGET_VUS` (wrapper)| Pool size; must be ≥ `TARGET_VUS`              |
| `MIN_THINK`/`MAX_THINK` | `5` / `15`        | Think-time bounds (seconds)                    |
| `RAMP_TOP`/`HOLD`/`RAMP_DOWN` | `5m`/`5m`/`2m` | Stage durations                                |
| `TOKEN_TTL_MIN`  | `7`                     | Access-token refresh age (session is 10 min)   |
| `LOAD_USER_PASSWORD` | `k6load1234`        | Pool password (seed + k6 must agree)           |
| `K6_BIN`         | `k6`                    | Path to the k6 binary                          |

## Why a dedicated account pool

1. **One active session per email.** `auth.service.ts` deactivates all other
   sessions on every login, so VUs sharing `student@lms.local` would kick each
   other off and produce 401 storms. The pool is `k6-user-0001@loadtest.local`
   …, one account per VU (`loadUser(__VU)`).
2. **10-minute session timeout.** `sessionTimeoutMin` defaults to 10 and is
   measured from the token's `iat`, so `ensureAuth()` refreshes the token at
   7 minutes instead of failing mid-hold.
3. **No signup emails.** `POST /api/users` fires `sendWelcomeEmail`; seeding
   goes through Prisma (`createMany`, one bcrypt hash for the whole pool)
   instead, so 5000 accounts produce zero emails.

`setup()` fails fast when the pool is missing/short (`LOAD_USER_COUNT <
TARGET_VUS`), when `/health` is not 200, or when the first/last pool account
cannot log in.

## Cleanup

`pnpm test:load:seed:cleanup` (and the wrapper's finally-block) deletes pool
users by email match plus every child row that references them —
`loginLog` and `graphApiLog` first (`onDelete: Restrict`), then
`adminSession`, `consentLog`, `twoFactorAuth`, `notification*`, `message`,
`support*`, `note`, `progress`, `lessonProgress`, `certificate`, `quizAttempt`,
`attendance`, `enrollmentRequest`, `packageEnrollment`, `courseEnrollment`,
`payment`, `refund`, `referral`, `auditLog`, `mentorshipTicket`,
`assignmentSubmission`, then the user rows themselves.

Tables a *student* can never write to (`batch`, `liveSession`,
`batchCourseMentor`, `batchAssignmentExtension`, `announcement`, `staticPage`,
`apiKey`, admin/graded/approved `*ById` columns) are intentionally **not**
deleted: if a pool user ever ends up referenced there, the user delete fails
loudly instead of silently removing course structure.

## Production runbook

```bash
# on the server, next to the API
DISABLE_RATE_LIMIT=true TARGET_VUS=5000 pnpm test:load:scale
```

- **`DISABLE_RATE_LIMIT=true` is mandatory.** The global limiter allows
  1000 req/15 min *per IP* and `authLimiter` 50 logins/15 min per IP; k6 is a
  single client IP, so a 5000-VU run would be throttled to 429s within
  seconds. The same flag skips both limiters (`app.ts`,
  `middleware/rate-limits.ts`).
- **Client sizing.** 5000 VUs with ~1 req / 6–16 s ≈ 500–800 req/s from one
  machine. Above ~1000 VUs on one box, k6's own CPU becomes the bottleneck:
  split with execution segments across 2–4 machines, e.g.
  `k6 run --exec-segment 0/3@0 --server-exec-segment 0/3@0 scale-5k.js` (and
  scale the pool to match), or a managed k6 Cloud run.
- **Server expectations.** The API is one Node process; past the single-core
  limit latency is dominated by bcrypt logins (cost 12) and the event loop.
  Expect p95 to degrade sharply before VU count does — that is the result,
  not a test bug.
- **DB pressure.** The pool adds `count` users and removes them again; run
  cleanup against a backup/replica only if you know what you are doing.

## Troubleshooting

| Symptom                                | Cause / fix                                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| `setup()` — "pool is below TARGET_VUS" | Re-seed with `--count=$TARGET_VUS` (or use the wrapper)           |
| `setup()` — seeded account login 401   | Pool not seeded, wrong DB, or `LOAD_USER_PASSWORD` mismatch       |
| 429 responses                          | `DISABLE_RATE_LIMIT=true` not set on the API                      |
| 401 partway through a hold             | 10-min session: lower `TOKEN_TTL_MIN` check / look for crashes    |
| `cannot start "k6"`                    | k6 not installed on the runner; set `K6_BIN`                      |
| Cleanup fails with an FK error         | A pool user is referenced by a table cleanup skips — inspect and  |
|                                        | remove that row manually (deliberate, see Cleanup)                |

Threshold tuning per profile lives in `options.thresholds`
(`thresholdFor(name, p95, p99, failRate)` in `helpers.js`). Global
`http_req_failed: rate<0.02` and `p95 < P95_MS` are the pass/fail gates for
production runs.
