import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

declare global {
  var prisma: PrismaClient | undefined;
}

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

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: { db: { url: getPrismaUrl() } },
    transactionOptions: { maxWait: 10000, timeout: 15000 },
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
