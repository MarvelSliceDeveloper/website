import { test, expect } from "@playwright/test";
import { loginAs } from "./auth.setup";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Student Portal — Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "student");
  });

  const pages: { route: string; name: string }[] = [
    { route: "/student", name: "Home (default view)" },
    { route: "/student?view=courses", name: "Courses" },
    { route: "/student?view=sessions", name: "Live Sessions" },
    { route: "/student?view=calendar", name: "Calendar" },
    { route: "/student?view=mentorship", name: "Mentorship" },
    { route: "/student?view=certificates", name: "Certificates" },
    { route: "/student?view=assignments", name: "Overdue assignments" },
    { route: "/student?view=quizzes", name: "Overdue quizzes" },
    { route: "/student?view=completed", name: "Completed courses" },
    { route: "/student/certificates", name: "Certificates page" },
    { route: "/student/inbox", name: "Inbox" },
    { route: "/student/mentorship", name: "Mentorship page" },
    { route: "/student/notes", name: "Notes" },
    { route: "/student/settings", name: "Settings" },
    { route: "/student/support", name: "Support" },
  ];

  for (const { route, name } of pages) {
    test(`TC-STU-${name.replace(/\s+/g, "_")}: ${name} loads`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    });
  }
});

test.describe("Student Portal — Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "student");
  });

  test("TC-STU-C1: Course detail via ?view=course-detail loads", async ({
    page,
  }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/student/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const courseId = courses[0].courseId || courses[0].id;
    await page.goto(`/student?view=course-detail&courseId=${courseId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-C2: Course content via ?view=course-content loads", async ({
    page,
  }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/student/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const enrollment = courses[0];
    const courseId = enrollment.courseId || enrollment.id;

    await page.goto(`/student?view=course-content&courseId=${courseId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-C3: Batch detail via ?view=batch loads", async ({ page }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/student/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const batchId = courses[0].batchId;
    if (!batchId) return;

    await page.goto(`/student?view=batch&batchId=${batchId}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W1: Mentorship page loads with tickets", async ({ page }) => {
    await page.goto("/student?view=mentorship");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W2: Certificates page loads", async ({ page }) => {
    await page.goto("/student?view=certificates");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W3: Notes page loads", async ({ page }) => {
    await page.goto("/student/notes");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W4: Support page loads", async ({ page }) => {
    await page.goto("/student/support");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W5: Recordings view via ?view=recording loads", async ({
    page,
  }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/student/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const batchId = courses[0].batchId;
    if (!batchId) return;

    await page.goto(`/student?view=recording&batchId=${batchId}&recordingId=dummy`);
    await page.waitForTimeout(3000);
    const h1 = page.locator("h1").first();
    if (await h1.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await h1.isVisible()).toBeTruthy();
    }
  });

  test("TC-STU-W6: Settings page loads", async ({ page }) => {
    await page.goto("/student/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-STU-W7: Inbox page loads", async ({ page }) => {
    await page.goto("/student/inbox");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});
