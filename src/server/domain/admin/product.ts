/**
 * Admin Product Management Domain Types
 */

import { ProductFlag } from "@/server/types/products";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categoryId: string;
  categoryName?: string;
  tags: string[];
  flags: ProductFlag[];
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
  sizes: string[];
  colors: string[];
  stock: number;
  sku: string | null;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListFilters {
  search?: string; // Search by name, SKU, tags
  categoryId?: string;
  flags?: ProductFlag[]; // Filter by any flags
  lowStock?: boolean; // Products below lowStockThreshold
  outOfStock?: boolean; // Stock = 0
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "price" | "stock";
  sortOrder?: "asc" | "desc";
}

export interface ProductListResult {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductInput {
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  currency?: string;
  sellerId?: string;
  categoryId: string;
  tags?: string[];
  flags?: ProductFlag[];
  images: string[];
  thumbnail: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  sku?: string;
  lowStockThreshold?: number;
}

export interface UpdateProductInput {
  slug?: string;
  name?: string;
  description?: string;
  price?: number;
  salePrice?: number;
  categoryId?: string;
  sellerId?: string;
  tags?: string[];
  flags?: ProductFlag[];
  images?: string[];
  thumbnail?: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  sku?: string;
  lowStockThreshold?: number;
}

export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  featuredProducts: number;
  totalInventoryValue: number;
}


