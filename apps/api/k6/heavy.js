// k6 heavy load test — 100 concurrent users
// Run: k6 run apps/api/k6/heavy.js
//       k6 run --out json=results.json apps/api/k6/heavy.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { BASE_URL, SEED_USERS, login } from "./helpers.js";

export const options = {
  stages: [
    { duration: "1m", target: 50 },    // warm ramp to 50
    { duration: "30s", target: 100 },   // ramp to 100
    { duration: "2m", target: 100 },    // hold at 100
    { duration: "30s", target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // relaxed — 100 users is heavy
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const user = SEED_USERS[Math.floor(Math.random() * SEED_USERS.length)];

  group("auth", function () {
    const res = login(http, BASE_URL, user.email, user.password);
    check(res, { "login 200": (r) => r.status === 200 });
  });

  group("courses", function () {
    const enrolled = http.get(`${BASE_URL}/api/courses/enrolled`, {
      tags: { name: "courses_enrolled" },
    });
    check(enrolled, { "enrolled 200": (r) => r.status === 200 });
  });

  group("sessions", function () {
    const sessions = http.get(`${BASE_URL}/api/sessions`, {
      tags: { name: "sessions" },
    });
    check(sessions, { "sessions 200": (r) => r.status === 200 });
  });

  group("health", function () {
    const res = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
    check(res, { "health 200": (r) => r.status === 200 });
  });

  // Random think time between requests
  sleep(Math.random() * 2 + 0.5);
}
