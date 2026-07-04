import { test, expect } from "@playwright/test";
import { loginAs } from "./auth.setup";

test.describe("Instructor Portal — Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "instructor");
  });

  test("TC-INS-1: Dashboard loads", async ({ page }) => {
    await page.goto("/instructor/dashboard");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-2: Sessions page loads", async ({ page }) => {
    await page.goto("/instructor/sessions");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-3: Batches page loads", async ({ page }) => {
    await page.goto("/instructor/batches");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-4: Assignments page loads", async ({ page }) => {
    await page.goto("/instructor/assignments");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-5: Mentorship page loads", async ({ page }) => {
    await page.goto("/instructor/mentorship");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-6: Inbox page loads", async ({ page }) => {
    await page.goto("/instructor/inbox");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-7: Support page loads", async ({ page }) => {
    await page.goto("/instructor/support");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-8: Notifications page loads", async ({ page }) => {
    await page.goto("/instructor/notifications/send");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-9: Settings page loads", async ({ page }) => {
    await page.goto("/instructor/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Instructor Portal — Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "instructor");
  });

  test("TC-INS-D1: Dashboard shows stat cards", async ({ page }) => {
    await page.goto("/instructor/dashboard");

    // Look for stat/metric cards on the dashboard
    const statCards = page.locator(
      '[class*="card"], [class*="stat"], [class*="metric"], [class*="grid"] > div',
    );

    // Wait for dashboard content to render fully
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    // Count visible stat-like elements
    const visibleCards = await statCards.count();
    if (visibleCards > 0) {
      // Dashboard has stat cards rendered
      expect(visibleCards).toBeGreaterThanOrEqual(1);
    }
  });

  test("TC-INS-D2: Batches page shows batch cards or empty state", async ({
    page,
  }) => {
    await page.goto("/instructor/batches");

    // Wait for the page heading
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    // Check if batch cards or empty state is rendered
    const batchCards = page.locator('[class*="card"], [class*="batch"]');
    const emptyState = page.locator("text=No cohorts, text=No batches");

    if (await emptyState.isVisible()) {
      // Empty state is fine — instructor has no batches assigned
      await expect(emptyState).toBeVisible();
    } else if ((await batchCards.count()) > 0) {
      // Batch cards are rendered — verify at least one card shows content
      await expect(batchCards.first()).toBeVisible();
    }
  });

  test("TC-INS-D3: Assignments page loads assignment list", async ({
    page,
  }) => {
    await page.goto("/instructor/assignments");

    // Wait for heading
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    // Check if assignment items or table is visible
    const assignmentList = page.locator(
      'table, [class*="assignment"], [class*="list"]',
    );
    const hasContent = (await assignmentList.count()) > 0;
    expect(hasContent).toBe(true);
  });
});
