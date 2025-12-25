/**
 * Admin Authentication Utilities
 * Helper functions for admin route protection
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { NextResponse } from "next/server";

export interface AdminSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

/**
 * Verify if the current session has admin privileges
 * Returns admin session or throws error response
 */
export async function verifyAdminSession(): Promise<
  AdminSession | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin (this requires fetching from database)
  // For now, we'll assume the session includes role
  const userRole = (session.user as any).role || "USER";

  if (userRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  return {
    user: {
      id: (session.user as any).id,
      name: session.user.name,
      email: session.user.email,
      role: userRole,
    },
  };
}

/**
 * Get admin ID from session
 * Returns admin ID or null
 */
export async function getAdminId(): Promise<string | null> {
  const result = await verifyAdminSession();

  if (result instanceof NextResponse) {
    return null;
  }

  return result.user.id;
}


