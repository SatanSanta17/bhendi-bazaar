/**
 * Orders API Routes
 *
 * GET /api/orders - List all orders for authenticated user
 * POST /api/orders - Create a new order
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { orderService } from "@/server/services/orderService";
import type { CreateOrderInput } from "@/server/domain/order";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const orders = await orderService.getOrdersByUserId(userId);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Orders can be created by both authenticated users and guests
  const userId = session?.user ? (session.user as any).id : undefined;

  let body: CreateOrderInput;
  try {
    body = (await request.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Add userId to the order if user is authenticated
    const orderInput: CreateOrderInput = {
      ...body,
      userId,
    };

    const order = await orderService.createOrder(orderInput);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 400 }
    );
  }
}

