/**
 * Admin Shipment Creation API
 * POST /api/admin/shipping/shipments
 * 
 * Create a shipment for an order (Admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { shippingOrchestrator } from "@/server/shipping";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createShipmentSchema = z.object({
  orderId: z.string(),
  providerId: z.string().optional(),
  courierCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Verify admin access
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const validated = createShipmentSchema.parse(body);

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: validated.orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 }
      );
    }

    // Check if shipment already created
    if (order.trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment already created for this order",
          trackingNumber: order.trackingNumber,
        },
        { status: 400 }
      );
    }

    // Parse order data
    const address = order.address as any;
    const items = order.items as any[];
    const totals = order.totals as any;

    // Calculate package weight
    const weight = items.reduce((sum, item) => sum + (item.weight || 0.5) * item.quantity, 0) || 1;

    // Get warehouse config
    const warehouseAddress = {
      name: process.env.WAREHOUSE_NAME || "Bhendi Bazaar",
      phone: process.env.WAREHOUSE_PHONE || "1234567890",
      email: process.env.WAREHOUSE_EMAIL || "warehouse@bhendibazaar.com",
      addressLine1: process.env.WAREHOUSE_ADDRESS || "123 Warehouse Street",
      city: process.env.WAREHOUSE_CITY || "Mumbai",
      state: process.env.WAREHOUSE_STATE || "Maharashtra",
      pincode: process.env.WAREHOUSE_PINCODE || "400001",
      country: "India",
    };

    // Build shipment request
    const shipmentRequest = {
      orderId: order.id,
      orderCode: order.code,
      fromAddress: warehouseAddress,
      toAddress: {
        name: address.fullName,
        phone: address.mobile,
        email: address.email,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || "India",
      },
      package: {
        weight,
        declaredValue: totals.total,
        description: `Order ${order.code}`,
        items: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          sku: item.productId,
        })),
      },
      mode: order.paymentMethod === "cod" ? ("cod" as const) : ("prepaid" as const),
      codAmount: order.paymentMethod === "cod" ? totals.total : undefined,
      selectedRate: validated.courierCode
        ? {
            providerId: validated.providerId!,
            providerName: "Shiprocket",
            courierName: "",
            courierCode: validated.courierCode,
            rate: order.shippingCost || 0,
            estimatedDays: 3,
            mode: order.paymentMethod === "cod" ? ("cod" as const) : ("prepaid" as const),
            available: true,
          }
        : undefined,
    };

    // Create shipment with fallback
    const shipment = await shippingOrchestrator.createShipmentWithFallback(
      shipmentRequest
    );

    // Update order with shipping details
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingProviderId: shipment.providerId,
        trackingNumber: shipment.trackingNumber,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        shipmentStatus: "created",
        lastStatusUpdate: new Date(),
        shippingMeta: shipment.metadata,
      },
    });

    return NextResponse.json({
      success: true,
      shipment: {
        trackingNumber: shipment.trackingNumber,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        estimatedDelivery: shipment.estimatedDelivery,
        labels: shipment.labels,
      },
      order: {
        id: order.id,
        code: order.code,
      },
    });
  } catch (error) {
    console.error("Create shipment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create shipment",
      },
      { status: 500 }
    );
  }
}

