/**
 * Admin Single Product API Routes
 * GET /api/admin/products/[id] - Get product details
 * PATCH /api/admin/products/[id] - Update product
 * DELETE /api/admin/products/[id] - Delete product
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { productsService } from "@server/admin/services/products.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    await productsService.deleteProduct(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 400 }
    );
  }
}


