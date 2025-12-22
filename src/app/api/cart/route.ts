// src/app/api/cart/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { cartService } from "@/server/services/cartService";

/**
 * API Routes act as the bridge between client and server
 * They can import from both sides to translate between them
 */

/**
 * GET /api/cart
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call server service
    const items = await cartService.getCart(session.user.id);

    // Return to client (types are compatible via JSON)
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("[API] GET /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const items = body.items; // Raw JSON - no type coupling

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid cart data" },
        { status: 400 }
      );
    }

    // Call server service (types converted at runtime)
    await cartService.updateCart(session.user.id, items);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] POST /api/cart failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to update cart";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await cartService.clearCart(session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] DELETE /api/cart failed:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}