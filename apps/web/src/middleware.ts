import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const protectedPrefixes = ["/admin", "/instructor", "/student"];

const superAdminPrefixes = [
  "/admin/logs",
  "/admin/trash",
  "/admin/announcements",
  "/admin/consent-logs",
  "/admin/settings/api-keys",
  "/admin/settings/permissions",
  "/admin/settings/system",
  "/admin/users/login-history",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  const isSuperAdminRoute = superAdminPrefixes.some((p) =>
    pathname.startsWith(p),
  );

  if (isSuperAdminRoute && token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      if (payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/student/:path*", "/login"],
};
