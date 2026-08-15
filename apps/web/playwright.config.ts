import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration — Chromium only (disk-space optimized).
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // Auto-start the API + Web dev servers when not already running.
  // `reuseExistingServer` keeps local DX fast when `pnpm dev` is active.
  webServer: [
    {
      command: "pnpm dev:api",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: "../..",
    },
    {
      command: "pnpm dev:web",
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: "../..",
    },
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
