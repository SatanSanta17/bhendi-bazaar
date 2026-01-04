// src/lib/csrf.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  // In production, use crypto.randomBytes or similar
  return crypto.randomUUID();
}

/**
 * Verify CSRF token for state-changing operations
 * Uses double-submit cookie pattern
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  // Only check for state-changing methods
  const method = request.method;
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true; // GET, HEAD, OPTIONS are safe
  }

  try {
    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    
    // Get token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

    // Both must exist and match
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("[CSRF] Token verification failed:", error);
    return false;
  }
}

/**
 * Middleware to verify CSRF token
 * Returns error response if verification fails
 */
export async function withCsrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  const isValid = await verifyCsrfToken(request);

  if (!isValid) {
    return NextResponse.json(
      {
        error: "Invalid CSRF token",
        message: "Your session may have expired. Please refresh the page.",
      },
      { status: 403 }
    );
  }

  return null; // Continue processing
}

/**
 * Set CSRF token in cookie
 * Call this on page load or API responses
 */
export function setCsrfCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCsrfToken();
  
  response.cookies.set(CSRF_TOKEN_NAME, csrfToken, {
    httpOnly: false, // Must be accessible to JavaScript for double-submit
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

