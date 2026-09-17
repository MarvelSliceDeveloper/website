import crypto from "crypto";
import { describe, it, expect } from "vitest";
import {
  verifySignature,
  generateDummyPassword,
  toAdminPaymentItem,
} from "../../modules/payments/payment.service";

describe("verifySignature", () => {
  it("returns true for valid HMAC signature", () => {
    const orderId = "order_123";
    const paymentId = "pay_456";
    const secret = "test_secret";

    // Generate expected HMAC
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Override env for this test
    const original = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_KEY_SECRET = secret;

    expect(verifySignature(orderId, paymentId, expected)).toBe(true);

    process.env.RAZORPAY_KEY_SECRET = original;
  });

  it("returns false for invalid signature", () => {
    const original = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_KEY_SECRET = "test_secret";

    expect(verifySignature("order_1", "pay_1", "invalid_sig")).toBe(false);

    process.env.RAZORPAY_KEY_SECRET = original;
  });
});

describe("generateDummyPassword", () => {
  it("returns a 10-character string", () => {
    const pw = generateDummyPassword();
    expect(pw).toHaveLength(10);
  });

  it("only contains allowed characters", () => {
    const allowed = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const pw = generateDummyPassword();
    for (const char of pw) {
      expect(allowed).toContain(char);
    }
  });

  it("excludes ambiguous characters (i, l, o, 0, 1)", () => {
    const excluded = ["i", "l", "o", "I", "L", "O", "0", "1"];
    // Run multiple times to increase confidence
    for (let run = 0; run < 20; run++) {
      const pw = generateDummyPassword();
      for (const char of pw) {
        expect(excluded).not.toContain(char);
      }
    }
  });

  it("generates different passwords on successive calls", () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 50; i++) {
      passwords.add(generateDummyPassword());
    }
    // With 10-char passwords from ~50 chars, collisions are extremely unlikely
    expect(passwords.size).toBeGreaterThan(1);
  });
});

describe("toAdminPaymentItem", () => {
  const baseRow = {
    id: "pay_1",
    amount: 99900,
    currency: "INR",
    status: "PAID",
    razorpayPaymentId: "pay_rz_1",
    createdAt: new Date("2026-09-01T10:00:00Z"),
    user: { name: "Test Student", email: "student@test.local" },
  };

  it("uses the package name when the payment has a package", () => {
    const item = toAdminPaymentItem({
      ...baseRow,
      package: { name: "Full Stack Pack" },
      course: null,
    });
    expect(item.packageName).toBe("Full Stack Pack");
  });

  it("falls back to the course title when package is null (course purchase)", () => {
    // Reproduces production 500: "Cannot read properties of null (reading 'name')"
    const item = toAdminPaymentItem({
      ...baseRow,
      package: null,
      course: { title: "React Basics" },
    });
    expect(item.packageName).toBe("React Basics");
  });
});
