import { describe, it, expect } from "vitest";
import { parseExpiryToMs } from "../../modules/auth/auth.controller";

describe("parseExpiryToMs", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;
  const MINUTE = 60 * 1000;

  it("parses days", () => {
    expect(parseExpiryToMs("7d")).toBe(7 * DAY);
  });

  it("parses hours", () => {
    expect(parseExpiryToMs("1h")).toBe(HOUR);
  });

  it("parses minutes", () => {
    expect(parseExpiryToMs("30m")).toBe(30 * MINUTE);
  });

  it("parses multi-digit numbers", () => {
    expect(parseExpiryToMs("14d")).toBe(14 * DAY);
    expect(parseExpiryToMs("24h")).toBe(24 * HOUR);
    expect(parseExpiryToMs("120m")).toBe(120 * MINUTE);
  });

  it("defaults to 7 days for invalid format", () => {
    expect(parseExpiryToMs("invalid")).toBe(7 * DAY);
  });

  it("defaults to 7 days for empty string", () => {
    expect(parseExpiryToMs("")).toBe(7 * DAY);
  });

  it("defaults to 7 days for unsupported unit", () => {
    expect(parseExpiryToMs("30s")).toBe(7 * DAY);
  });
});
