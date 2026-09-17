import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

const OUT = path.resolve(__dirname, "../../..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const pages: { name: string; path: string; waitFor?: string }[] = [
  { name: "01-catalogue", path: "/catalogue" },
  { name: "02-catalogue-slug-notfound", path: "/catalogue/non-existent-slug-for-screenshot" },
  { name: "03-admin-dashboard", path: "/admin/dashboard" },
  { name: "04-admin-courses", path: "/admin/courses" },
  { name: "05-admin-batches", path: "/admin/batches" },
  { name: "06-admin-sessions-hidden-check", path: "/admin/sessions" },
  { name: "07-admin-microsoft-hidden-check", path: "/admin/microsoft" },
  { name: "08-instructor-dashboard", path: "/instructor/dashboard" },
  { name: "09-instructor-batches", path: "/instructor/batches" },
  { name: "10-login", path: "/login" },
];

test.describe("screenshots - changed pages", () => {
  for (const p of pages) {
    test(p.name, async ({ page }) => {
      await page.goto(p.path, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, `${p.name}.png`), fullPage: true });
    });
  }

  test("11-catalogue-payment-real-package", async ({ page, request }) => {
    // Try to discover a real package slug via public API, then screenshot its payment page
    let slug: string | null = null;
    try {
      const res = await request.get("http://localhost:4000/api/packages/public");
      const data = await res.json();
      slug = data?.packages?.[0]?.slug ?? data?.packages?.[0]?.name ?? null;
      if (Array.isArray(data?.packages) && data.packages[0]?.slug) slug = data.packages[0].slug;
    } catch {}
    const target = slug ? `/catalogue/${slug}` : "/catalogue";
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `11-payment-${slug ?? "fallback"}.png`), fullPage: true });
  });
});
