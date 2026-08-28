import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// The Prisma client below is constructed at module-load time, but this module
// can be evaluated before index.ts/app.ts have called dotenv.config() (ESM
// import hoisting / require order). If DATABASE_URL isn't loaded yet the
// client is built with an empty URL and every query fails with
// "You must provide a nonempty URL". Load .env here too, walking up from this
// file so it works in dev (src/utils), built output (dist), and tests. dotenv
// never overrides already-set vars, so the nearest .env with the value wins.
function loadEnv(): void {
  let dir = __dirname;
  const root = path.parse(dir).root;
  do {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    dir = path.dirname(dir);
  } while (dir !== root);
}
loadEnv();

function getPrismaUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    // Pool size is env-driven: default 7. Keep it well below the Supabase
    // session-mode pooler limit (15) so that even a second process (tests,
    // a lingering dev server) doesn't trigger EMAXCONNSESSION errors.
    const connectionLimit = Number(process.env.DATABASE_CONNECTION_LIMIT) || 7;
    url.searchParams.set("connection_limit", String(connectionLimit));
    // Wait up to 30s for a pooled connection instead of failing immediately
    // during concurrent bursts (e.g. report pages firing parallel queries).
    url.searchParams.set("pool_timeout", "30");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

// TS 5.9.3 overflows (RangeError in isDeeplyNestedType / structuredTypeRelatedTo)
// whenever the full Prisma `PrismaClient` type is used as an explicit check target
// (annotation, assignment, union, or a `declare global { var prisma: PrismaClient }`
// augmentation that intersects into Node's Global type). The only construct that
// survives is a cast whose source is `any`, recovering the type via `typeof` on an
// inferred instance. So the global cache is stored opaquely on globalThis and the
// real PrismaClient type is recovered with `as typeof freshClient` (a type query on
// a value, which does not force ReturnType/structural materialization).
function createPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: getPrismaUrl() } },
    transactionOptions: { maxWait: 10000, timeout: 15000 },
  });
}

const freshClient = createPrismaClient();

// Deliberately `any` — never let PrismaClient appear as a checked type near the
// global scope. This avoids the TS 5.9.3 recursion bug above.
const globalForPrisma = globalThis as any;

if (!globalForPrisma.__marvel_prisma__) {
  globalForPrisma.__marvel_prisma__ = createPrismaClient();
}

export const prisma = globalForPrisma.__marvel_prisma__ as typeof freshClient;

if (process.env.NODE_ENV !== "production") void freshClient;
