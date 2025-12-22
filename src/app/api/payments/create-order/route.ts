/**
 * Create Payment Order API Route
 *
 * POST /api/payments/create-order - Create a payment order with the gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/server/services/paymentService";
import type { CreatePaymentOrderInput } from "@/server/domain/payment";

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentOrderInput = await request.json();

    const paymentOrder = await paymentService.createPaymentOrder(body);

    return NextResponse.json(paymentOrder);
  } catch (error) {
    console.error("Failed to create payment order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment order",
      },
      { status: 400 }
    );
  }
}

