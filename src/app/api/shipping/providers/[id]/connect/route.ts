// src/app/api/admin/shipping/providers/[id]/connect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminShippingService } from "@/server/services/admin/shippingService";
import { z } from "zod";

const connectSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  warehousePincode: z.string().regex(/^\d{6}$/).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = connectSchema.parse(body);

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
    });
  } catch (error) {
    console.error("Connect provider error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.message },
        { status: 400 }
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