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
  while (true) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnv();

function getPrismaUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    // Pool size is env-driven: default 10. Keep it well below Supabase session-mode pooler limit (15)
    // to prevent EMAXCONNSESSION max clients reached errors during concurrent portal loads.
    const connectionLimit =
      Number(process.env.DATABASE_CONNECTION_LIMIT) || 10;
    url.searchParams.set("connection_limit", String(connectionLimit));
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