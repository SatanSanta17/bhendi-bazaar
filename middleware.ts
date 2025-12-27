/**
 * Middleware for Next.js
 * Protects admin routes and redirects unauthorized users
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only initialize rate limiter if Redis credentials exist
let authRateLimitMiddleware: Ratelimit | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    authRateLimitMiddleware = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:auth:middleware",
    });
  } catch (error) {
    console.error("Failed to initialize rate limiter:", error);
  }
}

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

  // Rate limit auth endpoints (only if rate limiter is available)
  if (
    authRateLimitMiddleware &&
    (pathname.startsWith("/api/auth/signin") ||
      pathname.startsWith("/api/auth/callback"))
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

  // Redirect authenticated admins from home to admin dashboard
  if (pathname === "/" || pathname === "/signin") {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token && (token as any).role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch (error) {
      console.error("Error checking admin redirect:", error);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }

      const userRole = (token as any).role || "USER";
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Error protecting admin route:", error);
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    "/api/auth/:path*",
  ],
};
