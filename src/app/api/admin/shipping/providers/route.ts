/**
 * Shipping Providers API - Admin
 * GET /api/admin/shipping/providers
 * 
 * Fetch all shipping providers with statistics (Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { adminShippingService } from "@/server/services/admin/shippingService";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await verifyAdminSession();
    if (session instanceof NextResponse) {
      return session;
    }

    // Get providers and stats
    const [providers, stats] = await Promise.all([
      adminShippingService.getAllProviders(),
      adminShippingService.getProviderStats(),
    ]);

    return NextResponse.json({
      success: true,
      providers,
      stats,
    });
  } catch (error) {
    console.error("Get providers error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch providers",
      },
      { status: 500 }
    );
  }
}

