import { describe, it, expect, vi } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 1x1 red PNG — exercises the logo embed path without fixtures.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function baseData() {
  return {
    invoiceNumber: "INV-TEST1234",
    userName: "Test User",
    userEmail: "test@example.com",
    packageName: "Test Package",
    amount: 50000,
    discountAmount: 0,
    taxRate: 18,
    taxInclusive: true,
    date: new Date("2026-01-15"),
    paymentStatus: "PAID" as const,
  };
}

async function loadGenerator() {
  vi.resetModules();
  return (await import("../../services/invoice.service")).generateInvoicePdf;
}

describe("generateInvoicePdf letterhead", () => {
  it("renders a valid PDF with no logo configured", async () => {
    process.env.COMPANY_LOGO_PATH = "";
    const generateInvoicePdf = await loadGenerator();
    const pdf = generateInvoicePdf(baseData());
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("Test Package");
  });

  it("embeds the logo image when the file loads", async () => {
    const dir = join(tmpdir(), "invoice-logo-test");
    mkdirSync(dir, { recursive: true });
    const logoPath = join(dir, "logo.png");
    writeFileSync(logoPath, Buffer.from(TINY_PNG_BASE64, "base64"));
    process.env.COMPANY_LOGO_PATH = logoPath;
    const generateInvoicePdf = await loadGenerator();
    const pdf = generateInvoicePdf(baseData());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("/Subtype /Image");
  });

  it("still renders when the logo path is unreadable", async () => {
    process.env.COMPANY_LOGO_PATH = join(tmpdir(), "does-not-exist.png");
    const generateInvoicePdf = await loadGenerator();
    const pdf = generateInvoicePdf(baseData());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("falls back to name when the logo is an SVG", async () => {
    const dir = join(tmpdir(), "invoice-logo-test");
    mkdirSync(dir, { recursive: true });
    const svgPath = join(dir, "logo.svg");
    writeFileSync(svgPath, "<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    process.env.COMPANY_LOGO_PATH = svgPath;
    const generateInvoicePdf = await loadGenerator();
    const pdf = generateInvoicePdf(baseData());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).not.toContain("/Subtype /Image");
  });
});
