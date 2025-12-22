/**
 * Server-side domain types for Product
 *
 * These types are used exclusively on the server-side (services, repositories).
 */

export type ProductId = string;
export type CategorySlug = string;

export interface ServerProduct {
  id: ProductId;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  currency: "INR";
  categorySlug: CategorySlug;
  tags: string[];
  isFeatured: boolean;
  isHero: boolean;
  isOnOffer: boolean;
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
  sizes: string[];
  colors: string[];
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilter {
  categorySlug?: CategorySlug;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  offerOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

