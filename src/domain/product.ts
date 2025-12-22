/**
 * Client-side domain types for Product
 *
 * These types are used on the client-side (components, hooks).
 * They mirror the API response structure and are used for type safety.
 */

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
  isFeatured?: boolean;
  isHero?: boolean;
  isOnOffer?: boolean;
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
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


