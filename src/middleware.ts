// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Test: Redirect /test to home
  if (pathname === "/test") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Add a custom header to verify middleware is running
  const response = NextResponse.next();
  response.headers.set("X-Middleware-Test", "working");
  return response;
}

export const config = {
  matcher: "/:path*",
};
