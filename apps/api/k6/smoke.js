// k6 smoke test — quick sanity check
// Run: k6 run apps/api/k6/smoke.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, login } from "./helpers.js";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // 1. Public health check
  const health = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
  check(health, { "health status 200": (r) => r.status === 200 });

  // 2. Public catalogue (no auth)
  const catalogue = http.get(`${BASE_URL}/api/packages/public`, {
    tags: { name: "catalogue" },
  });
  check(catalogue, { "catalogue status 200": (r) => r.status === 200 });

  // 3. Admin login + authenticated /me
  const loginRes = login(http, BASE_URL, "admin@lms.local", "admin123");
  check(loginRes, { "login status 200": (r) => r.status === 200 });

  const me = http.get(`${BASE_URL}/api/auth/me`, { tags: { name: "me" } });
  check(me, { "me status 200": (r) => r.status === 200 });

  // 4. Student login + authenticated enrolled courses
  const studentLogin = login(
    http,
    BASE_URL,
    "student@lms.local",
    "student123",
  );
  check(studentLogin, { "student login status 200": (r) => r.status === 200 });

  const enrolled = http.get(`${BASE_URL}/api/courses/enrolled`, {
    tags: { name: "enrolled" },
  });
  check(enrolled, { "enrolled status 200": (r) => r.status === 200 });

  sleep(1);
}
