import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./auth.setup";

const API_BASE = process.env.API_URL || "http://localhost:4000";

/**
 * Exhaustive smoke coverage for every /api/admin/* router mounted in app.ts.
 *
 * Contracts enforced here:
 *  - List endpoints (no path params) MUST return exactly 200 for ADMIN.
 *  - Detail endpoints (path params) return 200 or 404 — 404 only proves the
 *    route exists with no seeded data; a 401/403/500 is a regression.
 *  - SUPER_ADMIN-only endpoints return 403 under ADMIN and 200 under
 *    SUPER_ADMIN.
 *  - Unauthenticated requests get 401; STUDENT gets 403 (spot checks).
 */

const ADMIN_LIST_ENDPOINTS: string[] = [
  "/api/admin/courses",
  "/api/admin/batches",
  "/api/admin/batches/courses",
  "/api/admin/batches/instructors",
  "/api/admin/enrollments",
  "/api/admin/packages",
  "/api/admin/dashboard/stats",
  "/api/admin/dashboard/analytics",
  "/api/admin/users/pending",
  "/api/admin/settings",
  "/api/admin/api-keys",
  "/api/admin/api-keys/youtube-status",
  "/api/admin/permissions",
  "/api/admin/quiz-templates",
  "/api/admin/assignment-templates",
  "/api/admin/logs",
  "/api/admin/logs/stats",
  "/api/admin/login-history",
  "/api/admin/consent-logs",
  "/api/admin/categories",
  "/api/admin/tags",
  "/api/admin/content/titles",
  "/api/admin/content/package-names",
  "/api/admin/certificates",
  "/api/admin/certificates/stats",
  "/api/admin/certificate-templates",
  "/api/admin/static-pages",
  "/api/admin/email-templates",
  "/api/admin/audit-logs",
  "/api/admin/announcements",
  "/api/admin/announcements/packages",
  "/api/admin/announcements/batches",
  "/api/admin/branding",
  "/api/admin/i18n/locales",
  "/api/admin/cache/status",
  "/api/admin/payments",
  "/api/admin/payments/revenue",
  "/api/admin/interns",
  "/api/admin/interns/fields",
  "/api/admin/interns/sessions",
  "/api/admin/interns/assignments/sheets",
  "/api/admin/maintenance",
  "/api/admin/refunds",
  "/api/admin/assignments/review",
  "/api/admin/assignments/review/stats",
  "/api/admin/instructors",
  "/api/admin/sessions",
  "/api/admin/sessions/all",
  "/api/admin/backup/list",
  "/api/admin/alerting-webhooks",
];

const SUPER_ADMIN_ONLY_ENDPOINTS = ["/api/admin/ai/status"];

const ADMIN_DETAIL_ENDPOINTS: string[] = [
  "/api/admin/courses/no-such-id",
  "/api/admin/packages/no-such-id",
  "/api/admin/quiz-templates/no-such-id",
  "/api/admin/assignment-templates/no-such-id",
  "/api/admin/certificates/no-such-id",
  "/api/admin/certificate-templates/no-such-id",
  "/api/admin/static-pages/no-such-id",
  "/api/admin/email-templates/no-such-id",
  "/api/admin/refunds/no-such-id",
  "/api/admin/instructors/no-such-id/performance",
  "/api/admin/login-history/no-such-user",
  "/api/admin/consent-logs/no-such-user",
];

async function newAuthedPage(
  browser: import("@playwright/test").Browser,
  role: "superadmin" | "student",
): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, role);
  return page;
}

test.describe("Admin API — exhaustive endpoint smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  for (const endpoint of ADMIN_LIST_ENDPOINTS) {
    test(`GET ${endpoint} → 200 as admin`, async ({ page }) => {
      const res = await page.request.get(`${API_BASE}${endpoint}`);
      expect(res.status(), `GET ${endpoint}`).toBe(200);
    });
  }

  for (const endpoint of ADMIN_DETAIL_ENDPOINTS) {
    test(`GET ${endpoint} → 200|404 as admin (never 401/403/500)`, async ({
      page,
    }) => {
      const res = await page.request.get(`${API_BASE}${endpoint}`);
      expect([200, 404]).toContain(res.status());
    });
  }

  test("detail chain: course detail by id from the list", async ({ page }) => {
    const listRes = await page.request.get(`${API_BASE}/api/admin/courses`);
    expect(listRes.status()).toBe(200);
    const courses = (await listRes.json()).courses ?? [];
    if (!Array.isArray(courses) || courses.length === 0) return;

    const detail = await page.request.get(
      `${API_BASE}/api/admin/courses/${courses[0].id}`,
    );
    expect(detail.status()).toBe(200);
  });

  for (const endpoint of SUPER_ADMIN_ONLY_ENDPOINTS) {
    test(`GET ${endpoint} → 403 under admin`, async ({ page }) => {
      const res = await page.request.get(`${API_BASE}${endpoint}`);
      expect(res.status()).toBe(403);
    });
  }

  test("GET /api/admin/trash → 200 under superadmin", async ({ browser }) => {
    const page = await newAuthedPage(browser, "superadmin");
    const res = await page.request.get(`${API_BASE}/api/admin/trash`);
    expect(res.status()).toBe(200);
    await page.context().close();
  });

  for (const endpoint of SUPER_ADMIN_ONLY_ENDPOINTS) {
    test(`GET ${endpoint} → 200 under superadmin`, async ({ browser }) => {
      const page = await newAuthedPage(browser, "superadmin");
      const res = await page.request.get(`${API_BASE}${endpoint}`);
      expect(res.status()).toBe(200);
      await page.context().close();
    });
  }

  test("unauthenticated requests to representative endpoints → 401", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const anon = await ctx.newPage();
    for (const endpoint of [
      "/api/admin/courses",
      "/api/admin/dashboard/stats",
      "/api/admin/payments",
      "/api/admin/users/pending",
    ]) {
      const res = await anon.request.get(`${API_BASE}${endpoint}`);
      expect(res.status(), `unauth GET ${endpoint}`).toBe(401);
    }
    await ctx.close();
  });

  test("student is rejected on representative admin endpoints → 403", async ({
    browser,
  }) => {
    const page = await newAuthedPage(browser, "student");
    for (const endpoint of [
      "/api/admin/courses",
      "/api/admin/dashboard/stats",
      "/api/admin/enrollments",
    ]) {
      const res = await page.request.get(`${API_BASE}${endpoint}`);
      expect(res.status(), `student GET ${endpoint}`).toBe(403);
    }
    await page.context().close();
  });
});
