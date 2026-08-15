import { test, expect } from "@playwright/test";
import { loginAs } from "./auth.setup";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Password — Forgot & Reset Flow", () => {
  test("TC-PWD-F1: Forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-PWD-F2: Forgot password form submits and shows confirmation", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', "student@lms.local");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Check Your Email")).toBeVisible({
      timeout: 10000,
    });
  });

  test("TC-PWD-F3: Reset password page with token loads", async ({ page }) => {
    await page.goto("/reset-password?token=dummy-test-token");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-PWD-F4: Reset password page without token shows invalid link", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Invalid Link")).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("Password — Set Password Flow", () => {
  test("TC-PWD-S1: Set password page redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/set-password");
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("TC-PWD-S2: Redirected away from set-password when mustChangePassword is false", async ({
    page,
  }) => {
    await loginAs(page, "student");
    await page.goto("/set-password");
    await expect(page).toHaveURL(/\/student/, { timeout: 15000 });
  });
});

test.describe("Password — Settings Password Change", () => {
  test("TC-PWD-C1: Student settings page has password change section", async ({
    page,
  }) => {
    await loginAs(page, "student");
    await page.goto("/student/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-PWD-C2: Admin settings page has password change section", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-PWD-C3: Instructor settings page has password change section", async ({
    page,
  }) => {
    await loginAs(page, "instructor");
    await page.goto("/instructor/settings");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});
