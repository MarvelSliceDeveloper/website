import { test, expect } from "@playwright/test";
import { loginAs } from "./auth.setup";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Instructor Portal — Page Load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "instructor");
  });

  const pages = [
    { route: "/instructor/dashboard", name: "Dashboard" },
    { route: "/instructor/courses", name: "Courses" },
    { route: "/instructor/sessions", name: "Sessions" },
    { route: "/instructor/batches", name: "Batches" },
    { route: "/instructor/assignments", name: "Assignments" },
    { route: "/instructor/mentorship", name: "Mentorship" },
    { route: "/instructor/inbox", name: "Inbox" },
    { route: "/instructor/support", name: "Support tickets" },
    { route: "/instructor/notifications/send", name: "Send notification" },
    { route: "/instructor/analytics", name: "Analytics" },
    { route: "/instructor/settings", name: "Settings" },
  ];

  for (const { route, name } of pages) {
    test(`TC-INS-${name.replace(/\s+/g, "_")}: ${name} loads`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
    });
  }
});

test.describe("Instructor Portal — Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "instructor");
  });

  test("TC-INS-W1: Settings page loads", async ({ page }) => {
    await page.goto("/instructor/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-W2: Analytics page loads", async ({ page }) => {
    await page.goto("/instructor/analytics");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-W3: Mentorship page loads", async ({ page }) => {
    await page.goto("/instructor/mentorship");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-INS-W4: Send notification page loads", async ({ page }) => {
    await page.goto("/instructor/notifications/send");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});
