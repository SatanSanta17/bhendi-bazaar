// src/app/api/admin/shipping/providers/[id]/disconnect/route.ts

import { authOptions } from "@/lib/auth-config";
import { adminShippingService } from "@/server/services/admin/shippingService";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
      const provider = await adminShippingService.disconnectProvider(id, session.user.id);
  
      return NextResponse.json({
        success: true,
        provider,
        message: "Provider disconnected successfully",
      });
    } catch (error) {
      console.error("Disconnect provider error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to disconnect provider",
        },
        { status: 500 }
      );
    }
  }