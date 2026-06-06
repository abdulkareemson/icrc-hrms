// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/careers",
  "/apply",
  "/api/auth",
  "/api/recruitment/applications",
  "/api/recruitment/vacancies",
];

// Static assets and Next.js internals to ignore
const IGNORED_PREFIXES = ["/_next", "/favicon.ico", "/api/uploadthing"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  for (const prefix of IGNORED_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Skip public files (SVGs, images, etc.)
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Allow public routes
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }

  // Allow the root page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("icrc_session");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
