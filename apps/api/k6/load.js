// k6 load test — simulate real user traffic
// Run: k6 run apps/api/k6/load.js
//       k6 run --out json apps/api/k6/results.json apps/api/k6/load.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { BASE_URL, SEED_USERS, login } from "./helpers.js";

export const options = {
  stages: [
    { duration: "30s", target: 20 },   // ramp-up to 20 users
    { duration: "1m", target: 20 },     // stay at 20
    { duration: "30s", target: 50 },    // ramp-up to 50
    { duration: "1m", target: 50 },     // stay at 50
    { duration: "30s", target: 0 },     // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  group("health", function () {
    const res = http.get(`${BASE_URL}/health`, { tags: { name: "health" } });
    check(res, { "health 200": (r) => r.status === 200 });
  });

  group("auth", function () {
    const user = SEED_USERS[Math.floor(Math.random() * SEED_USERS.length)];
    const res = login(http, BASE_URL, user.email, user.password);
    check(res, { "login 200": (r) => r.status === 200 });

    if (res.status === 200) {
      const me = http.get(`${BASE_URL}/api/auth/me`, { tags: { name: "me" } });
      check(me, { "me 200": (r) => r.status === 200 });
    }
  });

  group("courses", function () {
    const enrolled = http.get(`${BASE_URL}/api/courses/enrolled`, {
      tags: { name: "courses_enrolled" },
    });
    check(enrolled, { "enrolled 200": (r) => r.status === 200 });

    const catalogue = http.get(`${BASE_URL}/api/courses/catalogue`, {
      tags: { name: "courses_catalogue" },
    });
    check(catalogue, { "catalogue 200": (r) => r.status === 200 });
  });

  group("mentorship", function () {
    const tickets = http.get(`${BASE_URL}/api/mentorship/tickets`, {
      tags: { name: "mentorship_tickets" },
    });
    check(tickets, { "tickets 200": (r) => r.status === 200 });

    const stats = http.get(`${BASE_URL}/api/mentorship/stats`, {
      tags: { name: "mentorship_stats" },
    });
    check(stats, { "stats 200": (r) => r.status === 200 });
  });

  group("sessions", function () {
    const sessions = http.get(`${BASE_URL}/api/sessions`, {
      tags: { name: "sessions" },
    });
    check(sessions, { "sessions 200": (r) => r.status === 200 });
  });

  sleep(Math.random() * 3 + 1);
}
