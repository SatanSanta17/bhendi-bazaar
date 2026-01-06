/**
 * Shipment Tracking API
 * GET /api/shipping/track/[trackingNumber]
 * 
 * Track a shipment by AWB/tracking number.
 */

import { NextRequest, NextResponse } from "next/server";
import { shippingOrchestrator } from "@/server/shipping";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    if (!trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Tracking number is required",
        },
        { status: 400 }
      );
    }

    // Get order by tracking number to find provider
    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: {
        id: true,
        code: true,
        shippingProviderId: true,
      },
    });

    // Track shipment
    const tracking = await shippingOrchestrator.trackShipment(
      trackingNumber,
      order?.shippingProviderId || undefined
    );

    return NextResponse.json({
      success: true,
      tracking,
      orderCode: order?.code,
    });
  } catch (error) {
    console.error("Track shipment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track shipment",
      },
      { status: 500 }
    );
  }
}

