import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    // Pool size is env-driven: default 10. Keep it below the server's max
    // connections (Supabase session-mode pooler caps at 15) minus headroom.
    // Self-hosted Postgres can go higher via DATABASE_CONNECTION_LIMIT.
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