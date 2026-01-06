/**
 * Toggle Shipping Provider Status - Admin
 * PATCH /api/admin/shipping/providers/[id]/toggle
 * 
 * Enable or disable a shipping provider (Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { adminShippingService } from "@/server/services/admin/shippingService";
import { z } from "zod";

const toggleSchema = z.object({
  isEnabled: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const session = await verifyAdminSession();
    if (session instanceof NextResponse) {
      return session;
    }

    const { id } = await params;
    const body = await request.json();
    const validated = toggleSchema.parse(body);

    // Toggle provider via service
    const provider = await adminShippingService.toggleProvider(
      id,
      validated.isEnabled,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      provider,
      message: `${provider.name} ${validated.isEnabled ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("Toggle provider error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Provider not found") {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle provider",
      },
      { status: 500 }
    );
  }
}

