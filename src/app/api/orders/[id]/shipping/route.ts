/**
 * GET /api/orders/[id]/shipping
 * 
 * Get shipping details for a specific order
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        code: true,
        shippingProviderId: true,
        shippingProvider: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        trackingNumber: true,
        courierName: true,
        trackingUrl: true,
        shippingCost: true,
        packageWeight: true,
        packageDimensions: true,
        shipmentStatus: true,
        lastStatusUpdate: true,
        deliveredAt: true,
        estimatedDelivery: true,
        shippingMeta: true,
        shippingEvents: {
          select: {
            id: true,
            eventType: true,
            status: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shipping: {
        providerId: order.shippingProviderId,
        providerName: order.shippingProvider?.name,
        providerCode: order.shippingProvider?.code,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        trackingUrl: order.trackingUrl,
        shippingCost: order.shippingCost,
        packageWeight: order.packageWeight,
        packageDimensions: order.packageDimensions,
        shipmentStatus: order.shipmentStatus,
        lastStatusUpdate: order.lastStatusUpdate,
        deliveredAt: order.deliveredAt,
        estimatedDelivery: order.estimatedDelivery,
        shippingMeta: order.shippingMeta,
        events: order.shippingEvents,
      },
    });
  } catch (error) {
    console.error("Error fetching order shipping:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipping information" },
      { status: 500 }
    );
  }
}

