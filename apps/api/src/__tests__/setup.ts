import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

process.env.NODE_ENV = "test";

// ── Test-env fallbacks ────────────────────────────────────────────────
// CI should inject these via `env:` in the workflow, but local dev may
// have a broken .env or be running without one. Provide safe defaults so
// `app.ts` (CSRF/JWT) and `prisma.ts` don't throw "missing env var" /
// "must provide a nonempty URL" before the real tests even start.
// Real secrets (Brevo, etc.) are intentionally NOT stubbed — tests that
// need them should mock the service, not the env var.
process.env.DATABASE_URL ??= "postgresql://lms_test:test@localhost:5432/lms_test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.JWT_SECRET ??= "test-jwt-secret-must-be-32-chars-long!!";
process.env.CSRF_SECRET ??= "test-csrf-secret-must-be-32-chars!!";
process.env.TOKEN_ENCRYPTION_KEY ??= "test-32-byte-encryption-key-12345";
process.env.WEB_URL ??= "http://localhost:3000";
process.env.API_URL ??= "http://localhost:4000";
