import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

const protectedPrefixes = ["/admin", "/instructor", "/student"];

const superAdminPrefixes = [
  "/admin/super-admin",
  "/admin/audit-logs",
  "/admin/trash",
  "/admin/announcements",
  "/admin/consent-logs",
  "/admin/settings/api-keys",
  "/admin/settings/permissions",
  "/admin/settings/system",
  "/admin/settings/backup",
  "/admin/settings/ai",
  "/admin/maintenance",
  "/admin/session-management",
  "/admin/users/login-history",
  "/admin/refunds/approvals",
];

const bypassRoutes = ["/login", "/maintenance", "/_next", "/api/"];

let maintenanceCache: {
  enabled: boolean;
  message: string;
  expiresAt: number;
} | null = null;

async function checkMaintenanceStatus(requestUrl: string): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now < maintenanceCache.expiresAt) {
    return maintenanceCache.enabled;
  }
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000"}/api/maintenance-status`,
      {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      },
    );
    if (res.ok) {
      const data = await res.json();
      maintenanceCache = {
        enabled: !!data.enabled,
        message: data.message || "",
        expiresAt: now + 15000,
      };
      return maintenanceCache.enabled;
    }
  } catch {
    /* API unreachable — don't block the app */
  }
  maintenanceCache = { enabled: false, message: "", expiresAt: now + 15000 };
  return false;
}

export async function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  // Bypass maintenance check for whitelisted routes
  const isBypassRoute = bypassRoutes.some((p) => pathname.startsWith(p));
  if (isBypassRoute) {
    return NextResponse.next();
  }

  // Check maintenance status for all other routes
  const isMaintenance = await checkMaintenanceStatus(request.url);

  // Admins and super-admins can bypass maintenance
  if (token) {
    try {
      // `decodeJwt` only decodes base64 claims — it does NOT verify the JWT
      // signature or expiry, and the web server has no JWT_SECRET. So these
      // role checks are UX-only routing hints. Real authorization is enforced
      // server-side by the API's requireAuth/requireRole/requireSuperAdmin.
      const payload = decodeJwt(token);
      if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
        return NextResponse.next();
      }
    } catch {
      /* invalid token — treat as unauthenticated */
    }
  }

  // During maintenance, non-admin visitors see the maintenance page
  if (isMaintenance) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isSuperAdminRoute = superAdminPrefixes.some((p) =>
    pathname.startsWith(p),
  );

  if (isSuperAdminRoute && token) {
    try {
      const payload = decodeJwt(token);
      if (payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /* eslint-disable max-len */
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/login",
    "/",
    "/(courses|pricing|about|contact)/:path*",
  ],
  /* eslint-enable max-len */
};
