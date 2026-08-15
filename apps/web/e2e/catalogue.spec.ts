import { test, expect, type Page } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:4000";

test.describe("Public Catalogue — Page Load", () => {
  test("TC-CAT-home: Catalogue home loads", async ({ page }) => {
    await page.goto("/catalogue");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Public Catalogue — Detail Pages", () => {
  // The public catalogue is packages-only: GET /api/packages/public returns
  // { packages } and detail pages live at /catalogue/[slug].
  async function getFirstPackageSlug(page: Page): Promise<string | null> {
    const packagesRes = await page.request.get(
      `${API_BASE}/api/packages/public`,
    );
    if (packagesRes.status() !== 200) return null;
    const data = await packagesRes.json();
    const packages = data.packages;
    if (!packages || packages.length === 0) return null;
    return packages[0].slug || packages[0].id;
  }

  test("TC-CAT-package: Package detail via catalogue slug loads", async ({
    page,
  }) => {
    const slug = await getFirstPackageSlug(page);
    if (!slug) return;

    await page.goto(`/catalogue/${slug}`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-checkout: Checkout via catalogue slug loads", async ({
    page,
  }) => {
    const slug = await getFirstPackageSlug(page);
    if (!slug) return;

    await page.goto(`/catalogue/${slug}?checkout=1`);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-static-page: Static page via /pages/[slug] loads", async ({
    page,
  }) => {
    await page.goto("/pages/terms");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  });

  test("TC-CAT-404: Unknown catalogue slug shows not-found state", async ({
    page,
  }) => {
    await page.goto(`/catalogue/nonexistent-slug-${Date.now()}`);
    await expect(page.getByText("Package not found")).toBeVisible({
      timeout: 15000,
    });
  });
});
