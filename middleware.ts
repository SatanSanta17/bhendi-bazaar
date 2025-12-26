/**
 * Middleware for Next.js
 * Protects admin routes and redirects unauthorized users
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter for auth routes
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const authRateLimitMiddleware = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:auth:middleware",
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return cfConnectingIp || realIp || "unknown";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth endpoints
  if (
    pathname.startsWith("/api/auth/signin") ||
    pathname.startsWith("/api/auth/callback")
  ) {
    const ip = getClientIp(request);
    const { success, reset } = await authRateLimitMiddleware.limit(ip);

    if (!success) {
      const timeRemaining = reset - Date.now();
      const seconds = Math.ceil(timeRemaining / 1000);

      return NextResponse.json(
        {
          error: `Too many authentication attempts. Please try again in ${seconds} seconds.`,
        },
        { status: 429 }
      );
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if user is authenticated
    if (!token) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has admin role
    const userRole = (token as any).role || "USER";
    if (userRole !== "ADMIN") {
      // Redirect non-admin users to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    "/api/auth/:path*", // Add auth routes to matcher
  ],
};


