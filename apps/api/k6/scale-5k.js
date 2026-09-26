// k6 scale test — staged ladder up to TARGET_VUS concurrent users.
//
// Recommended: use the wrapper, which seeds the account pool first and
// deletes it again afterwards (even on failure or Ctrl+C):
//   pnpm test:load:scale                 # 500 users, the default ladder
//   TARGET_VUS=5000 pnpm test:load:scale  # the 5000-user run
//
// Raw k6 (pool must already exist — pnpm test:load:seed):
//   k6 run -e BASE_URL=https://api.example.com -e TARGET_VUS=5000 \
//     apps/api/k6/scale-5k.js
//
// Knobs: TARGET_VUS, P95_MS, LOAD_USER_COUNT, MIN_THINK, MAX_THINK,
//        RAMP_TOP, HOLD, RAMP_DOWN, BASE_URL.

import http from "k6/http";
import { check, group, sleep } from "k6";
import {
  BASE_URL,
  LOAD_USER_COUNT,
  authedGet,
  ensureAuth,
  loadUser,
  login,
  thresholdFor,
} from "./helpers.js";

const TARGET_VUS = Number(__ENV.TARGET_VUS || 500);
const P95_MS = Number(__ENV.P95_MS || 1500);
const MIN_THINK_S = Number(__ENV.MIN_THINK || 5);
const MAX_THINK_S = Number(__ENV.MAX_THINK || 15);

const step = (pct) => Math.max(1, Math.round((TARGET_VUS * pct) / 100));

export const options = {
  // 5000 VUs x response bodies is a lot of Go heap for nothing — the
  // checks below only need status codes.
  discardResponseBodies: true,
  scenarios: {
    ladder: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: step(20) }, // warm-up
        { duration: "1m", target: step(20) },
        { duration: "3m", target: step(60) },
        { duration: "2m", target: step(60) },
        { duration: __ENV.RAMP_TOP || "5m", target: TARGET_VUS },
        { duration: __ENV.HOLD || "5m", target: TARGET_VUS },
        { duration: __ENV.RAMP_DOWN || "2m", target: 0 },
      ],
      gracefulRampDown: "60s",
      tags: { test: "scale-5k" },
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${P95_MS}`, `p(99)<${P95_MS * 3}`],
    http_req_failed: ["rate<0.02"],
    // bcrypt (cost 12) makes login intrinsically slow — budget it
    // separately so a slow login can't hide a healthy API.
    ...thresholdFor("login", 3000, 8000, 0.05),
    ...thresholdFor("health", 500, 1500, 0.01),
    ...thresholdFor("courses_catalogue", 2000, 5000, 0.02),
  },
};

// setup() runs once, before any VU. Fail fast with something actionable
// instead of letting 500 VUs rediscover the same problem.
export function setup() {
  if (LOAD_USER_COUNT < TARGET_VUS) {
    throw new Error(
      `LOAD_USER_COUNT (${LOAD_USER_COUNT}) is below TARGET_VUS ` +
        `(${TARGET_VUS}): VUs would share accounts and log each other ` +
        `out. Re-seed with --count=${TARGET_VUS}.`,
    );
  }

  const health = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
  if (health.status !== 200) {
    throw new Error(
      `${BASE_URL}/health returned HTTP ${health.status} — is the API up, ` +
        `and is BASE_URL correct?`,
    );
  }

  // Prove both ends of the seeded pool can actually authenticate.
  for (const index of [1, LOAD_USER_COUNT]) {
    const user = loadUser(index);
    const res = login(http, BASE_URL, user.email, user.password);
    if (res.status !== 200) {
      throw new Error(
        `Seeded account ${user.email} failed to log in (HTTP ${res.status}). ` +
          `Run "pnpm test:load:seed" with --count=${LOAD_USER_COUNT}.`,
      );
    }
  }

  return { target: TARGET_VUS, pool: LOAD_USER_COUNT, baseUrl: BASE_URL };
}

export default function () {
  group("public", function () {
    const health = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
    check(health, { "health 200": (r) => r.status === 200 });

    const packages = http.get(`${BASE_URL}/api/packages/public`, {
      tags: { name: "packages_public" },
    });
    check(packages, { "packages 200": (r) => r.status === 200 });
  });

  group("auth", function () {
    // Logged in once per VU; refresh is handled inside ensureAuth().
    const token = ensureAuth(http);
    check({ token }, { "login ok": (t) => !!t.token });
  });

  group("student reads", function () {
    const me = authedGet(http, "/api/auth/me", "me");
    check(me, { "me 200": (r) => r.status === 200 });

    const enrolled = authedGet(
      http,
      "/api/courses/enrolled",
      "courses_enrolled",
    );
    check(enrolled, { "enrolled 200": (r) => r.status === 200 });

    const catalogue = authedGet(
      http,
      "/api/courses/catalogue",
      "courses_catalogue",
    );
    check(catalogue, { "catalogue 200": (r) => r.status === 200 });

    const sessions = authedGet(http, "/api/sessions", "sessions");
    check(sessions, { "sessions 200": (r) => r.status === 200 });

    const tickets = authedGet(
      http,
      "/api/mentorship/tickets/my",
      "mentorship_tickets",
    );
    check(tickets, { "tickets 200": (r) => r.status === 200 });
  });

  sleep(MIN_THINK_S + Math.random() * (MAX_THINK_S - MIN_THINK_S));
}

export function teardown() {
  console.log(
    `Target ${TARGET_VUS} VUs against ${BASE_URL}. The account pool is ` +
      `still in the database — run "pnpm test:load:seed:cleanup" unless ` +
      `you used the wrapper (pnpm test:load:scale), which cleans up itself.`,
  );
}
