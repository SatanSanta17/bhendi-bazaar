// src/app/api/admin/shipping/providers/[id]/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { adminShippingService } from "@/server/services/admin/shippingService";
import { z } from "zod";

const connectSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  warehousePincode: z.string().length(6).optional(),
});

export async function POST(
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
    const validated = connectSchema.parse(body);

    // Connect provider via service
    const provider = await adminShippingService.connectProvider(
      id,
      {
        email: validated.email,
        password: validated.password,
        warehousePincode: validated.warehousePincode,
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      provider,
      message: `${provider.name} connected successfully`,
    });
  } catch (error) {
    console.error("Connect provider error:", error);

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
        error: error instanceof Error ? error.message : "Failed to connect provider",
      },
      { status: 500 }
    );
  }
}