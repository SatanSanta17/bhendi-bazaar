/**
 * Client-side domain types for Product
 *
 * These types are used on the client-side (components, hooks).
 * They mirror the API response structure and are used for type safety.
 */

import { ProductFlag } from "@/types/product";

export type ProductId = string;
export type CategorySlug = string;

export interface Product {
  id: ProductId;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  currency: "INR";
  categorySlug: CategorySlug;
  tags: string[];
  flags?: ProductFlag[];
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
  stock: number;
  lowStockThreshold: number;
  options?: {
    sizes?: string[];
    colors?: string[];
  };
}

export interface ProductFilter {
  categorySlug?: CategorySlug;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  offerOnly?: boolean;
  featuredOnly?: boolean;
}


