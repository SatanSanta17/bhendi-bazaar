// src/app/api/cart/sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { cartService } from "@/server/services/cartService";

/**
 * POST /api/cart/sync
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
    const localItems = body.items || [];

    // Call server service
    const mergedItems = await cartService.syncCart(
      session.user.id,
      localItems
    );

    return NextResponse.json({ items: mergedItems }, { status: 200 });
  } catch (error) {
    console.error("[API] POST /api/cart/sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync cart" },
      { status: 500 }
    );
  }
}