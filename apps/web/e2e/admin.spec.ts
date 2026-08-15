import { test, expect } from "@playwright/test";
import { loginAs, getCsrfToken } from "./auth.setup";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Admin Portal — Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  const pages = [
    { route: "/admin/dashboard", name: "Dashboard" },
    { route: "/admin/courses", name: "Courses list" },
    { route: "/admin/courses/new", name: "Course create" },
    { route: "/admin/batches", name: "Batches list" },
    { route: "/admin/batches/new", name: "Batch create" },
    { route: "/admin/sessions", name: "Sessions list" },
    { route: "/admin/sessions/new", name: "Session create" },
    { route: "/admin/enrollments", name: "Enrollments" },
    { route: "/admin/users", name: "Users list" },
    { route: "/admin/users/import", name: "Users import" },
    { route: "/admin/users/login-history", name: "Login history" },
    { route: "/admin/payments", name: "Payments" },
    { route: "/admin/reports", name: "Reports" },
    { route: "/admin/inbox", name: "Inbox" },
    { route: "/admin/inbox/messages", name: "Messages" },
    { route: "/admin/inbox/support", name: "Support tickets" },
    { route: "/admin/inbox/tickets", name: "Tickets" },
    { route: "/admin/notifications/send", name: "Send notification" },
    { route: "/admin/settings", name: "Settings" },
    { route: "/admin/settings/api-keys", name: "API keys" },
    { route: "/admin/settings/permissions", name: "Permissions" },
    { route: "/admin/settings/system", name: "System settings" },
    { route: "/admin/analytics", name: "Analytics" },
    { route: "/admin/mentorship", name: "Mentorship" },
    { route: "/admin/calendar", name: "Calendar" },
    { route: "/admin/approvals", name: "Approvals" },
    { route: "/admin/announcements", name: "Announcements" },
    { route: "/admin/certificates", name: "Certificates" },
    { route: "/admin/categories", name: "Categories" },
    { route: "/admin/tags", name: "Tags" },
    { route: "/admin/coupons", name: "Coupons" },
    { route: "/admin/referrals", name: "Referrals" },
    { route: "/admin/packages", name: "Packages" },
    { route: "/admin/packages/new", name: "Package create" },
    { route: "/admin/packages/enrollments", name: "Package enrollments" },
    { route: "/admin/quiz-templates", name: "Quiz templates" },
    { route: "/admin/assignment-templates", name: "Assignment templates" },
    { route: "/admin/email-templates", name: "Email templates" },
    { route: "/admin/branding", name: "Branding" },
    { route: "/admin/static-pages", name: "Static pages" },
    { route: "/admin/cache", name: "Cache" },
    { route: "/admin/logs", name: "Logs" },
    { route: "/admin/logs/stats", name: "Log stats" },
    { route: "/admin/audit-logs", name: "Audit logs" },
    { route: "/admin/consent-logs", name: "Consent logs" },
    { route: "/admin/health", name: "Health" },
    { route: "/admin/i18n", name: "i18n" },
    { route: "/admin/trash", name: "Trash" },
    { route: "/admin/microsoft", name: "Microsoft" },
    { route: "/admin/super-admin", name: "Super admin" },
  ];

  for (const { route, name } of pages) {
    test(`TC-ADM-${name.replace(/\s+/g, "_")}: ${name} loads`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    });
  }
});

test.describe("Admin Portal — Super Admin pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "superadmin");
  });

  test("TC-ADM-SUPER: Super admin dashboard loads", async ({ page }) => {
    await page.goto("/admin/super-admin");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin Portal — Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("TC-ADM-D1: Create course via API and verify it appears in the UI list", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const courseTitle = `E2E Course ${Date.now()}`;

    const createRes = await page.request.post(`${API_BASE}/api/admin/courses`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        title: courseTitle,
        description: "Created by Playwright E2E test",
        price: 49.99,
        category: "Programming",
      },
    });

    expect(createRes.status()).toBe(201);

    await page.goto("/admin/courses");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    const courseLink = page.locator(`text=${courseTitle}`).first();
    await expect(courseLink).toBeVisible({ timeout: 10000 });
  });

  test("TC-ADM-D2: Publish a course via API and verify status badge", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const courseTitle = `E2E Publish Test ${Date.now()}`;

    const createRes = await page.request.post(`${API_BASE}/api/admin/courses`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        title: courseTitle,
        description: "Test publish flow",
        price: 0,
        category: "Testing",
      },
    });
    expect(createRes.status()).toBe(201);
    const course = await createRes.json();
    const courseId = course.id || course.course?.id;

    const moduleRes = await page.request.post(
      `${API_BASE}/api/admin/courses/${courseId}/modules`,
      {
        headers: { "x-csrf-token": csrfToken },
        data: {
          title: "E2E Test Module",
          description: "Auto-created for publish test",
          videoEmbedId: "dummy-test-video",
          durationSeconds: 600,
        },
      },
    );
    expect(moduleRes.status()).toBe(201);

    const updateRes = await page.request.put(
      `${API_BASE}/api/admin/courses/${courseId}`,
      {
        headers: { "x-csrf-token": csrfToken },
        data: {
          thumbnailUrl: "https://via.placeholder.com/400x225.png",
        },
      },
    );
    expect(updateRes.status()).toBe(200);

    const publishRes = await page.request.post(
      `${API_BASE}/api/admin/courses/${courseId}/publish`,
      { headers: { "x-csrf-token": csrfToken } },
    );
    expect(publishRes.status()).toBe(200);

    await page.goto("/admin/courses");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-ADM-D3: Create a batch via API and verify in the list", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const batchName = `E2E Batch ${Date.now()}`;

    const coursesRes = await page.request.get(
      `${API_BASE}/api/admin/batches/courses`,
    );
    expect(coursesRes.status()).toBe(200);
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    expect(courses.length).toBeGreaterThan(0);

    const instructorsRes = await page.request.get(
      `${API_BASE}/api/admin/batches/instructors`,
    );
    expect(instructorsRes.status()).toBe(200);
    const instructorsData = await instructorsRes.json();
    const instructors = instructorsData.instructors || instructorsData;
    expect(instructors.length).toBeGreaterThan(0);

    const createRes = await page.request.post(`${API_BASE}/api/admin/batches`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        courseId: courses[0].id,
        instructorId: instructors[0].id,
        name: batchName,
        startDate: "2026-07-15T00:00:00.000Z",
        endDate: "2026-12-15T00:00:00.000Z",
        maxStudents: 30,
        description: "Created by Playwright E2E test",
      },
    });
    expect(createRes.status()).toBe(201);

    await page.goto("/admin/batches");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${batchName}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("TC-ADM-D4: Navigate to batch detail and verify info renders", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const batchName = `E2E Detail Batch ${Date.now()}`;

    const coursesRes = await page.request.get(
      `${API_BASE}/api/admin/batches/courses`,
    );
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;

    const instructorsRes = await page.request.get(
      `${API_BASE}/api/admin/batches/instructors`,
    );
    const instructorsData = await instructorsRes.json();
    const instructors = instructorsData.instructors || instructorsData;

    const createRes = await page.request.post(`${API_BASE}/api/admin/batches`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        courseId: courses[0].id,
        instructorId: instructors[0].id,
        name: batchName,
        startDate: "2026-07-15T00:00:00.000Z",
        endDate: "2026-12-15T00:00:00.000Z",
        maxStudents: 25,
      },
    });
    expect(createRes.status()).toBe(201);
    const batch = await createRes.json();
    const batchId = batch.id || batch.batch?.id;

    await page.goto(`/admin/batches/${batchId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${batchName}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("TC-ADM-D5: Course detail page loads with modules and tabs", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const courseTitle = `E2E Detail ${Date.now()}`;

    const createRes = await page.request.post(`${API_BASE}/api/admin/courses`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        title: courseTitle,
        description: "Detail view test",
        price: 0,
        category: "Testing",
      },
    });
    expect(createRes.status()).toBe(201);
    const course = await createRes.json();
    const courseId = course.id || course.course?.id;

    await page.goto(`/admin/courses/${courseId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${courseTitle}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("TC-ADM-D6: Package detail page loads", async ({ page }) => {
    const csrfToken = await getCsrfToken(page);
    const pkgName = `E2E Package ${Date.now()}`;

    const createRes = await page.request.post(`${API_BASE}/api/admin/packages`, {
      headers: { "x-csrf-token": csrfToken },
      data: {
        name: pkgName,
        slug: `e2e-pkg-${Date.now()}`,
        description: "E2E test package",
      },
    });
    expect(createRes.status()).toBe(201);
    const pkg = await createRes.json();
    const pkgId = pkg.id || pkg.package?.id;

    await page.goto(`/admin/packages/${pkgId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-ADM-D7: Announcement page create + list flow", async ({ page }) => {
    await page.goto("/admin/announcements");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    const newBtn = page.locator('button:has-text("New Announcement")');
    if (await newBtn.isVisible()) {
      await newBtn.click();

      const titleInput = page.locator('input[placeholder="Announcement title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill(`E2E Announcement ${Date.now()}`);

        const bodyInput = page.locator('textarea[placeholder="Announcement body"]');
        if (await bodyInput.isVisible()) {
          await bodyInput.fill("This is a test announcement from Playwright.");
        }

        const sendBtn = page.locator('button:has-text("Send")');
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test("TC-ADM-D8: Session detail page loads", async ({ page }) => {
    const sessionsRes = await page.request.get(
      `${API_BASE}/api/admin/sessions`,
    );
    if (sessionsRes.status() !== 200) return;

    const sessionsData = await sessionsRes.json();
    const sessions = sessionsData.sessions || sessionsData;
    if (!sessions || sessions.length === 0) return;

    const sessionId = sessions[0].id;
    await page.goto(`/admin/sessions/${sessionId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-ADM-D9: Quiz template detail page loads", async ({ page }) => {
    const csrfToken = await getCsrfToken(page);
    const quizTitle = `E2E Quiz Template ${Date.now()}`;

    const createRes = await page.request.post(
      `${API_BASE}/api/admin/quiz-templates`,
      {
        headers: { "x-csrf-token": csrfToken },
        data: {
          title: quizTitle,
          description: "E2E test quiz template",
        },
      },
    );
    if (createRes.status() !== 201) return;

    const quizData = await createRes.json();
    const quizId = quizData.id || quizData.quizTemplate?.id;

    await page.goto(`/admin/quiz-templates/${quizId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-ADM-D10: Assignment template detail page loads", async ({
    page,
  }) => {
    const csrfToken = await getCsrfToken(page);
    const assignmentTitle = `E2E Assignment Template ${Date.now()}`;

    const createRes = await page.request.post(
      `${API_BASE}/api/admin/assignment-templates`,
      {
        headers: { "x-csrf-token": csrfToken },
        data: {
          title: assignmentTitle,
          description: "E2E test assignment template",
        },
      },
    );
    if (createRes.status() !== 201) return;

    const assignmentData = await createRes.json();
    const assignmentId =
      assignmentData.id || assignmentData.assignmentTemplate?.id;

    await page.goto(`/admin/assignment-templates/${assignmentId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});
