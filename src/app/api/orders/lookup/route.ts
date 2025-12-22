/**
 * Order Lookup API Route
 *
 * POST /api/orders/lookup - Lookup order by code (for guest orders)
 */

import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/orderService";

interface LookupBody {
  code: string;
}

export async function POST(request: NextRequest) {
  let body: LookupBody;
  try {
    body = (await request.json()) as LookupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.code) {
    return NextResponse.json(
      { error: "Order code is required" },
      { status: 400 }
    );
  }

  try {
    const order = await orderService.lookupOrderByCode(body.code);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to lookup order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to lookup order",
      },
      { status: 500 }
    );
  }
}

