/**
 * Admin Products API Routes
 * GET /api/admin/products - List products with filters
 * POST /api/admin/products - Create new product
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { adminProductService } from "../../../../../server/services/admin/productService";
import type {
  ProductFilters,
  CreateProductInput,
} from "../../../../../server/domain/admin/product";
import { ProductFlag } from "@/types/product";

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);

    const filters: ProductFilters = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      flags: searchParams.get("flags")
        ? searchParams
            .get("flags")!
            .split(",")
            .map((flag) => flag as ProductFlag)
        : undefined,
      lowStock: searchParams.get("lowStock") === "true" ? true : undefined,
      outOfStock: searchParams.get("outOfStock") === "true" ? true : undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const result = await adminProductService.getProducts(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   const session = await verifyAdminSession();
//   if (session instanceof NextResponse) return session;

//   try {
//     const body = (await request.json()) as CreateProductInput;
//     const product = await adminProductService.createProduct(
//       body as CreateProductInput
//     );

//     return NextResponse.json(product, { status: 201 });
//   } catch (error) {
//     console.error("Failed to create product:", error);
//     return NextResponse.json(
//       {
//         error:
//           error instanceof Error ? error.message : "Failed to create product",
//       },
//       { status: 400 }
//     );
//   }
// }


