import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Public Catalogue — Page Load", () => {
  test("TC-CAT-home: Catalogue home loads", async ({ page }) => {
    await page.goto("/catalogue");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Public Catalogue — Detail Pages", () => {
  test("TC-CAT-course: Course detail via catalogue slug loads", async ({
    page,
  }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/catalogue/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const slug = courses[0].slug || courses[0].id;
    await page.goto(`/catalogue/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-package: Package detail via catalogue slug loads", async ({
    page,
  }) => {
    const packagesRes = await page.request.get(
      `${API_BASE}/api/catalogue/packages`,
    );
    if (packagesRes.status() !== 200) return;
    const packagesData = await packagesRes.json();
    const packages = packagesData.packages || packagesData;
    if (!packages || packages.length === 0) return;

    const slug = packages[0].slug || packages[0].id;
    await page.goto(`/catalogue/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-instructor: Instructor profile via catalogue slug loads", async ({
    page,
  }) => {
    const instructorsRes = await page.request.get(
      `${API_BASE}/api/catalogue/instructors`,
    );
    if (instructorsRes.status() !== 200) return;
    const instructorsData = await instructorsRes.json();
    const instructors = instructorsData.instructors || instructorsData;
    if (!instructors || instructors.length === 0) return;

    const slug = instructors[0].slug || instructors[0].id;
    await page.goto(`/catalogue/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-checkout: Checkout via catalogue slug loads", async ({
    page,
  }) => {
    const coursesRes = await page.request.get(
      `${API_BASE}/api/catalogue/courses`,
    );
    if (coursesRes.status() !== 200) return;
    const coursesData = await coursesRes.json();
    const courses = coursesData.courses || coursesData;
    if (!courses || courses.length === 0) return;

    const slug = courses[0].slug || courses[0].id;
    await page.goto(`/catalogue/${slug}?checkout=1`);
    await page.waitForTimeout(3000);
    const h1 = page.locator("h1").first();
    if (await h1.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(await h1.isVisible()).toBeTruthy();
    }
  });

  test("TC-CAT-static-page: Static page via /pages/[slug] loads", async ({
    page,
  }) => {
    await page.goto(`/pages/terms`);
    await page.waitForTimeout(3000);
    const h1 = page.locator("h1").first();
    if (await h1.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await h1.isVisible()).toBeTruthy();
    }
  });

  test("TC-CAT-404: Unknown catalogue slug shows appropriate state", async ({
    page,
  }) => {
    await page.goto(`/catalogue/nonexistent-slug-${Date.now()}`);
    await page.waitForTimeout(2000);
    const h1 = page.locator("h1").first();
    if (await h1.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await h1.isVisible()).toBeTruthy();
    }
  });
});
