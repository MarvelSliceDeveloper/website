// k6 smoke test — quick sanity check
// Run: k6 run apps/api/k6/smoke.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "./helpers.js";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // 1. Health check
  const health = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
  check(health, { "health status 200": (r) => r.status === 200 });

  // 2. Login as admin
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "admin@lms.local", password: "admin123" }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "login" } }
  );
  check(loginRes, { "login status 200": (r) => r.status === 200 });

  // 3. Get auth/me
  const me = http.get(`${BASE_URL}/api/auth/me`, { tags: { name: "me" } });
  check(me, { "me status 200": (r) => r.status === 200 });

  sleep(1);
}
