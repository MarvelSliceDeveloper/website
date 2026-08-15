import { test as setup, expect, type Page } from "@playwright/test";

/** Demo credentials matching the seed data. */
const CREDENTIALS = {
  admin: { email: "admin@lms.local", password: "admin123", role: "ADMIN" },
  superadmin: {
    email: "superadmin@lms.local",
    password: "superadmin123",
    role: "SUPER_ADMIN",
  },
  instructor: {
    email: "instructor@lms.local",
    password: "instructor123",
    role: "INSTRUCTOR",
  },
  student: {
    email: "student@lms.local",
    password: "student123",
    role: "STUDENT",
  },
} as const;

type Role = keyof typeof CREDENTIALS;

const API_BASE = process.env.API_URL || "http://localhost:4000";

/**
 * Log in via API and set the auth cookie on the page.
 * Returns the user info so tests can verify role.
 */
export async function loginAs(page: Page, role: Role) {
  const creds = CREDENTIALS[role];
  const response = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.user).toBeDefined();
  expect(body.user.role).toBe(creds.role);

  // Set the accessToken cookie so subsequent requests are authenticated
  await page.context().addCookies([
    {
      name: "accessToken",
      value: body.accessToken,
      domain: new URL(process.env.BASE_URL || "http://localhost:3000").hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);

  return body.user;
}

/**
 * Log in via UI (testing the actual login form).
 * Used by auth.spec.ts for the UI login flow test.
 */
export async function loginViaUi(page: Page, role: Role) {
  const creds = CREDENTIALS[role];
  await page.goto("/login");
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  // Wait for navigation after login (slow dev compile needs extended timeout)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

export { CREDENTIALS };
export type { Role };

/**
 * Fetch a CSRF token from the API. The token is needed as the
 * `x-csrf-token` header on state-changing requests (POST/PUT/PATCH/DELETE).
 */
export async function getCsrfToken(page: Page): Promise<string> {
  const res = await page.request.get(`${API_BASE}/api/csrf-token`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.csrfToken;
}
