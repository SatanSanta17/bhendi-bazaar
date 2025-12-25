/**
 * Stock Check API Route
 * POST /api/products/check-stock - Check stock availability for multiple items
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface StockCheckItem {
  productId: string;
  quantity: number;
}

interface StockCheckRequest {
  items: StockCheckItem[];
}

export async function POST(request: NextRequest) {
  try {
    const { items }: StockCheckRequest = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: items array required" },
        { status: 400 }
      );
    }

    // Check stock for each item
    const stockStatus = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true },
        });

        if (!product) {
          return {
            productId: item.productId,
            available: false,
            stock: 0,
            requested: item.quantity,
            error: "Product not found",
          };
        }

        return {
          productId: item.productId,
          name: product.name,
          available: product.stock >= item.quantity,
          stock: product.stock,
          requested: item.quantity,
        };
      })
    );

    const allAvailable = stockStatus.every((s) => s.available);

    return NextResponse.json({
      available: allAvailable,
      items: stockStatus,
    });
  } catch (error) {
    console.error("Stock check failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check stock",
      },
      { status: 500 }
    );
  }
}

