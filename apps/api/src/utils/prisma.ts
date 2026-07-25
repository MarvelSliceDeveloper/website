import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("connection_limit", "2");
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