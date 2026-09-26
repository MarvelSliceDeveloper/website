// k6 shared helpers
//
// Point any profile at an environment:
//   k6 run -e BASE_URL=https://api.example.com apps/api/k6/<profile>.js

export const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const SEED_USERS = [
  { email: "admin@lms.local", password: "admin123", role: "admin" },
  {
    email: "instructor@lms.local",
    password: "instructor123",
    role: "instructor",
  },
  { email: "student@lms.local", password: "student123", role: "student" },
];

// ── Load-test account pool ─────────────────────────────────────────────────
// Created by `pnpm test:load:seed`, removed by `pnpm test:load:seed:cleanup`.
//
// The API enforces ONE active session per email (auth.service.ts — every
// login deactivates that user's other sessions), so two VUs sharing an
// account would log each other out mid-test and show up as phantom 401s.
// Every VU therefore owns a dedicated account: k6-user-0001..N.
export const LOAD_USER_PREFIX = __ENV.LOAD_USER_PREFIX || "k6-user";
export const LOAD_USER_DOMAIN = __ENV.LOAD_USER_DOMAIN || "loadtest.local";
export const LOAD_USER_PASSWORD = __ENV.LOAD_USER_PASSWORD || "k6load1234";
// Pool size must cover TARGET_VUS: sharing an account between VUs logs them
// out mid-test. Defaults to TARGET_VUS so `TARGET_VUS=5000 k6 run ...`
// checks the pool it actually needs (setup() fails loudly if it is short).
export const LOAD_USER_COUNT = Number(
  __ENV.LOAD_USER_COUNT || __ENV.TARGET_VUS || 500,
);

// Access tokens carry sessionTimeoutMin (User default 10, measured from
// iat in auth.middleware.ts) — refresh well before that or a long run
// starts 401-ing halfway through.
const TOKEN_TTL_MIN = Number(__ENV.TOKEN_TTL_MIN || 7);

const EMAIL_PAD = Math.max(4, String(LOAD_USER_COUNT).length);

export function loadUser(vu = __VU) {
  const index = ((vu - 1) % LOAD_USER_COUNT) + 1;
  return {
    email: `${LOAD_USER_PREFIX}-${String(index).padStart(EMAIL_PAD, "0")}@${LOAD_USER_DOMAIN}`,
    password: LOAD_USER_PASSWORD,
  };
}

// Login and return the response (cookie auto-attached by k6 http jar)
export function login(http, baseUrl, email, password) {
  return http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    },
  );
}

// Access token from the shared k6 cookie jar. Needed because profiles with
// discardResponseBodies (scale-5k.js) get `null` bodies — res.json() throws
// — while the login route still stores the cookie. Verified behaviour: k6
// keeps a `Secure` cookie received over plain HTTP but does not resend it,
// so reading the value here (and sending it as a Bearer token) also covers
// a production API behind plain HTTP.
function cookieToken(http, baseUrl) {
  try {
    const cookies = http.cookieJar().cookiesForURL(`${baseUrl}/`);
    const values = cookies && cookies.accessToken;
    return Array.isArray(values) && values.length > 0 ? values[0] : null;
  } catch (err) {
    return null;
  }
}

// ── Per-VU auth ────────────────────────────────────────────────────────────
// Module state is per-VU in k6, so this cache is shared across iterations
// of the same VU and invisible to every other VU.
const authCache = { email: null, token: null, obtainedAt: 0 };

export function invalidateAuth() {
  authCache.token = null;
}

export function ensureAuth(http, baseUrl = BASE_URL, user = loadUser()) {
  const now = Date.now();
  if (
    authCache.token &&
    authCache.email === user.email &&
    now - authCache.obtainedAt < TOKEN_TTL_MIN * 60000
  ) {
    return authCache.token;
  }

  const res = login(http, baseUrl, user.email, user.password);
  if (res.status !== 200) return null;

  let token = null;
  try {
    token = res.json("accessToken");
  } catch (err) {
    // body discarded (discardResponseBodies) or not JSON — fall through
    token = null;
  }
  if (!token) token = cookieToken(http, baseUrl);
  if (!token) return null;

  authCache.email = user.email;
  authCache.token = token;
  authCache.obtainedAt = now;
  return token;
}

// Authenticated GET with one transparent re-login on 401 — covers the token
// ageing out and the session being kicked by a later login on that email.
export function authedGet(http, path, tag, baseUrl = BASE_URL) {
  const fetchOnce = () => {
    const token = ensureAuth(http, baseUrl);
    return http.get(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      tags: { name: tag },
    });
  };

  let res = fetchOnce();
  if (res.status === 401) {
    invalidateAuth();
    res = fetchOnce();
  }
  return res;
}

// Generate threshold object for a given request name
export function thresholdFor(name, p95 = 500, p99 = 1000, failRate = 0.01) {
  return {
    [`http_req_duration{name:${name}}`]: [`p(95)<${p95}`, `p(99)<${p99}`],
    [`http_req_failed{name:${name}}`]: [`rate<${failRate}`],
  };
}
