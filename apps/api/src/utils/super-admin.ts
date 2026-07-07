import { prisma } from "./prisma";

let cachedSuperAdminId: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSuperAdminId(): Promise<string | null> {
  if (cachedSuperAdminId && Date.now() < cacheExpiry) {
    return cachedSuperAdminId;
  }

  const superAdmin = await prisma.user.findFirst({
    where: {
      role: "SUPER_ADMIN",
      msAccessToken: { not: null },
    },
    select: { id: true },
  });

  cachedSuperAdminId = superAdmin?.id ?? null;
  cacheExpiry = Date.now() + CACHE_TTL_MS;

  return cachedSuperAdminId;
}

export function clearSuperAdminCache(): void {
  cachedSuperAdminId = null;
  cacheExpiry = 0;
}
