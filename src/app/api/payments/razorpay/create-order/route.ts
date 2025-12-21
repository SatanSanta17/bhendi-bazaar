import { NextRequest, NextResponse } from "next/server";
import { paymentGateway } from "@/server/repositories/razorpayGateway";
import type { CreatePaymentOrderInput } from "@/domain/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, localOrderId, customer } =
      body as Partial<CreatePaymentOrderInput>;

    // Validation
    if (!amount || !currency || !localOrderId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, currency, or localOrderId" },
        { status: 400 }
      );
    }

    // Use repository to create order
    const order = await paymentGateway.createOrder({
      amount,
      currency,
      localOrderId,
      customer,
    });

    return NextResponse.json({
      orderId: order.gatewayOrderId,
      amount: order.amount,
      currency: order.currency,
      provider: order.provider,
    });
  } catch (error) {
    console.error("Payment order creation failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create payment order";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}