// lib/data-access/products.dal.ts

import { cache } from "react";
import { productsService } from "@server/admin/services/products.service";
import type { ProductFilters, ProductForTable, ProductStats } from "./types";
import type { Pagination } from "@/types/shared";
import { ProductFlag } from "@/types/shared";

class ProductsDAL {
  // ✅ React cache - deduplicates requests in same render
  getProducts = cache(async (filters: ProductFilters): Promise<{ products: ProductForTable[]; pagination: Pagination }> => {
    const { products, pagination } = await productsService.getProducts(filters);
    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        flags: product.flags as ProductFlag[],
        price: product.price,
        salePrice: product.salePrice ?? undefined,
        currency: product.currency,
        rating: product.rating,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        thumbnail: product.thumbnail,
        createdAt: product.createdAt,
        category: product.category,
        seller: product.seller,
      })), pagination
    };
  });

  getStats = cache(async (): Promise<ProductStats> => {
    const stats = await productsService.getStats();
    return {
      totalProducts: stats.totalProducts,
      lowStockProducts: stats.lowStockProducts,
      outOfStockProducts: stats.outOfStockProducts,
      featuredProducts: stats.featuredProducts,
      totalInventoryValue: stats.totalInventoryValue,
    };
  });
}

export const productsDAL = new ProductsDAL();