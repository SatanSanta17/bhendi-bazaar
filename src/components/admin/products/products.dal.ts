// lib/data-access/products.dal.ts

import { cache } from "react";
import { adminProductService } from "@server/services/admin/productService";
import type { ProductFilters, ProductForTable, ProductDetails, ProductStats } from "./types";
import type { Pagination } from "@/types/shared";
import { ProductFlag } from "@/types/admin/products";

class ProductsDAL {
  // ✅ React cache - deduplicates requests in same render
  getProducts = cache(async (filters: ProductFilters): Promise<{ products: ProductForTable[]; pagination: Pagination }> => {
    const { products, pagination } = await adminProductService.getProducts(filters);
    return { products: products.map(product => ({
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
    })), pagination };
  });
  
  getProduct = cache(async (id: string): Promise<ProductDetails> => {
    const product = await adminProductService.getProductById(id);
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice ?? undefined,
      currency: product.currency,
      category: product.category,
      tags: product.tags,
      flags: product.flags as ProductFlag[],
      sku: product.sku ?? undefined,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      images: product.images,
      thumbnail: product.thumbnail,
      sizes: product.sizes,
      colors: product.colors,
      seller: product.seller,
      shippingFromPincode: product.shippingFromPincode ?? "",
      shippingFromCity: product.shippingFromCity ?? "",
      shippingFromLocation: product.shippingFromLocation ?? "",
      createdAt: product.createdAt,
    };
  });

  getStats = cache(async (): Promise<ProductStats> => {
    const stats = await adminProductService.getStats();
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