import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";
const isLoadTest = process.env.DISABLE_RATE_LIMIT === "true";

// Strict limiter for auth endpoints — brute-force protection for
// login/register/forgot-password. Skipped in tests so the supertest suites
// (which log in dozens of times per file) stay green, and in load tests so
// k6 scenarios (which log in per VU on every iteration) aren't throttled.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  skip: () => isTest || isLoadTest,
});
