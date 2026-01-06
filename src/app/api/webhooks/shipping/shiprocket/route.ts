/**
 * Shiprocket Webhook Handler
 * POST /api/webhooks/shipping/shiprocket
 * 
 * Receives tracking updates from Shiprocket and updates order status.
 */

import { NextRequest, NextResponse } from "next/server";
import { shippingOrchestrator } from "@/server/shipping";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log("Shiprocket webhook received:", payload);

    // Get provider ID
    const provider = await prisma.shippingProvider.findUnique({
      where: { code: "shiprocket" },
      select: { id: true },
    });

    if (!provider) {
      console.error("Shiprocket provider not found in database");
      return NextResponse.json(
        { success: false, error: "Provider not configured" },
        { status: 500 }
      );
    }

    // Process webhook
    const webhookEvent = await shippingOrchestrator.handleWebhook(
      provider.id,
      payload
    );

    // Find order by tracking number
    const order = await prisma.order.findFirst({
      where: { trackingNumber: webhookEvent.trackingNumber },
    });

    if (!order) {
      console.warn(`Order not found for tracking number: ${webhookEvent.trackingNumber}`);
      // Still return 200 to acknowledge webhook
      return NextResponse.json({ success: true, message: "Order not found" });
    }

    // Update order status
    const updateData: any = {
      shipmentStatus: webhookEvent.status.status,
      lastStatusUpdate: new Date(),
    };

    // If delivered, set deliveredAt timestamp
    if (webhookEvent.status.status === "delivered") {
      updateData.deliveredAt = webhookEvent.status.timestamp;
      updateData.status = "delivered"; // Update order status too
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // Log webhook event
    await prisma.shippingEvent.create({
      data: {
        order: {
          connect: { id: order.id },
        },
        provider: {
          connect: { id: provider.id },
        },
        eventType: "webhook_received",
        status: "success",
        response: payload,
        metadata: {
          trackingNumber: webhookEvent.trackingNumber,
          status: webhookEvent.status.status,
          providerStatus: webhookEvent.status.providerStatus,
        },
      },
    });

    // TODO: Send customer notification (email/SMS) based on status
    // if (webhookEvent.status.status === 'out_for_delivery') {
    //   await sendOutForDeliveryNotification(order);
    // }
    // if (webhookEvent.status.status === 'delivered') {
    //   await sendDeliveredNotification(order);
    // }

    console.log(`✓ Webhook processed for order ${order.code}`);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      orderCode: order.code,
      status: webhookEvent.status.status,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Log failed webhook
    try {
      const payload = await request.json();
      await prisma.shippingEvent.create({
        data: {
          order: {
            connect: { id: "unknown" },
          },
          provider: {
            connect: { code: "shiprocket" },
          },
          eventType: "webhook_received",
          status: "failed",
          request: payload,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      }).catch(() => {
        // Ignore if logging fails
      });
    } catch {
      // Ignore
    }

    // Always return 200 to prevent webhook retries
    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 200 }
    );
  }
}

