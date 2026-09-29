import { describe, it, expect } from "vitest";
import {
  normalizeUtr,
  buildUpiIntent,
  validateUpiId,
} from "../../modules/manual-orders/manual-orders.validation";

describe("manual order validation", () => {
  it("accepts 12-digit UTR", () => {
    expect(normalizeUtr("123456789012")).toBe("123456789012");
  });
  it("uppercases alphanumeric UPI refs", () => {
    expect(normalizeUtr("  abcd1234efgh  ")).toBe("ABCD1234EFGH");
  });
  it("rejects short UTR", () => {
    expect(() => normalizeUtr("123")).toThrow();
  });
  it("rejects UTR with special chars", () => {
    expect(() => normalizeUtr("1234-5678-9012")).toThrow();
  });
  it("builds UPI intent", () => {
    const s = buildUpiIntent({
      upiId: "test@okhdfc",
      payeeName: "Marvel",
      amountPaise: 50000,
      note: "Course",
    });
    expect(s).toContain("upi://pay?pa=test%40okhdfc");
    expect(s).toContain("am=500.00");
    expect(s).toContain("cu=INR");
  });
  it("accepts valid UPI ID", () => {
    expect(() => validateUpiId("marvelslice@okhdfc")).not.toThrow();
  });
  it("rejects invalid UPI ID", () => {
    expect(() => validateUpiId("not-a-upi")).toThrow();
  });
});
