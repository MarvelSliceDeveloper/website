// k6 shared helpers

export const BASE_URL = "http://localhost:4000";

export const SEED_USERS = [
  { email: "admin@lms.local", password: "admin123", role: "admin" },
  {
    email: "instructor@lms.local",
    password: "instructor123",
    role: "instructor",
  },
  { email: "student@lms.local", password: "student123", role: "student" },
];

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

// Generate threshold object for a given request name
export function thresholdFor(name, p95 = 500, p99 = 1000, failRate = 0.01) {
  return {
    [`http_req_duration{name:${name}}`]: [`p(95)<${p95}`, `p(99)<${p99}`],
    [`http_req_failed{name:${name}}`]: [`rate<${failRate}`],
  };
}
