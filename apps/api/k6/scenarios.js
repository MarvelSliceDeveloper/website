// k6 scenarios test — mixed user roles with realistic behavior
// Run: k6 run apps/api/k6/scenarios.js

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, login } from "./helpers.js";

export const options = {
  scenarios: {
    admins: {
      executor: "ramping-vus",
      exec: "adminFlow",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 3 },
        { duration: "1m", target: 3 },
        { duration: "30s", target: 0 },
      ],
      tags: { role: "admin" },
    },
    instructors: {
      executor: "ramping-vus",
      exec: "instructorFlow",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 5 },
        { duration: "1m", target: 5 },
        { duration: "20s", target: 0 },
      ],
      tags: { role: "instructor" },
    },
    students: {
      executor: "ramping-vus",
      exec: "studentFlow",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 30 },
        { duration: "2m", target: 30 },
        { duration: "30s", target: 0 },
      ],
      tags: { role: "student" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.05"],
  },
};

function loginCheck(role, res) {
  check(res, { [`${role} login 200`]: (r) => r.status === 200 });
}

export function adminFlow() {
  // Each VU logs in with its own cookie jar (setup() cookies don't propagate)
  loginCheck("admin", login(http, BASE_URL, "admin@lms.local", "admin123"));

  // Admin: manage mentorship, view all courses, view stats
  http.get(`${BASE_URL}/api/mentorship/tickets`, {
    tags: { name: "admin_tickets" },
  });
  http.get(`${BASE_URL}/api/mentorship/mentors`, {
    tags: { name: "admin_mentors" },
  });
  http.get(`${BASE_URL}/api/mentorship/stats`, {
    tags: { name: "admin_stats" },
  });
  http.get(`${BASE_URL}/api/courses/enrolled`, {
    tags: { name: "admin_courses" },
  });
  http.get(`${BASE_URL}/api/sessions`, { tags: { name: "admin_sessions" } });

  sleep(Math.random() * 5 + 2);
}

export function instructorFlow() {
  loginCheck(
    "instructor",
    login(http, BASE_URL, "instructor@lms.local", "instructor123"),
  );

  // Instructor: view assigned tickets, sessions
  http.get(`${BASE_URL}/api/mentorship/tickets`, {
    tags: { name: "instructor_tickets" },
  });
  http.get(`${BASE_URL}/api/sessions`, {
    tags: { name: "instructor_sessions" },
  });
  http.get(`${BASE_URL}/api/courses/enrolled`, {
    tags: { name: "instructor_courses" },
  });

  sleep(Math.random() * 5 + 2);
}

export function studentFlow() {
  loginCheck(
    "student",
    login(http, BASE_URL, "student@lms.local", "student123"),
  );

  // Student: enrolled courses, live sessions, mentorship tickets
  http.get(`${BASE_URL}/api/courses/enrolled`, {
    tags: { name: "student_courses" },
  });
  http.get(`${BASE_URL}/api/sessions`, { tags: { name: "student_sessions" } });
  http.get(`${BASE_URL}/api/mentorship/tickets/my`, {
    tags: { name: "student_tickets" },
  });
  http.get(`${BASE_URL}/api/auth/me`, { tags: { name: "student_me" } });

  sleep(Math.random() * 5 + 2);
}
