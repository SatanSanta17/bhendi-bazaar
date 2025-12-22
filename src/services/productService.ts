/**
 * Client-side Product Service
 *
 * This service handles all product-related API calls from the client side.
 * UI components should use this service instead of making direct fetch calls.
 */

import type { Product, ProductFilter } from "@/domain/product";

export class ProductService {
  private baseUrl = "/api/products";

  /**
   * Get all products with optional filtering
   */
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      const params = new URLSearchParams();

      if (filter?.categorySlug) {
        params.append("categorySlug", filter.categorySlug);
      }
      if (filter?.search) {
        params.append("search", filter.search);
      }
      if (filter?.minPrice !== undefined) {
        params.append("minPrice", filter.minPrice.toString());
      }
      if (filter?.maxPrice !== undefined) {
        params.append("maxPrice", filter.maxPrice.toString());
      }
      if (filter?.offerOnly) {
        params.append("offerOnly", "true");
      }
      if (filter?.featuredOnly) {
        params.append("featuredOnly", "true");
      }

      const url = params.toString()
        ? `${this.baseUrl}?${params.toString()}`
        : this.baseUrl;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] getProducts failed:", error);
      throw error;
    }
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Product not found");
        }
        throw new Error("Failed to fetch product");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] getProductBySlug failed:", error);
      throw error;
    }
  }

  /**
   * Get similar products for recommendations
   */
  async getSimilarProducts(slug: string, limit = 4): Promise<Product[]> {
    try {
      const url = `${this.baseUrl}/${slug}/similar?limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch similar products");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] getSimilarProducts failed:", error);
      return []; // Return empty array on error for recommendations
    }
  }

  /**
   * Get featured/hero products for homepage
   */
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    try {
      const url = `${this.baseUrl}/featured?limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch featured products");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] getFeaturedProducts failed:", error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get products on offer
   */
  async getOfferProducts(limit?: number): Promise<Product[]> {
    try {
      const url = limit
        ? `${this.baseUrl}/offers?limit=${limit}`
        : `${this.baseUrl}/offers`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch offer products");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] getOfferProducts failed:", error);
      return []; // Return empty array on error
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        search: query,
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to search products");
      }

      return response.json();
    } catch (error) {
      console.error("[ProductService] searchProducts failed:", error);
      return [];
    }
  }
}

export const productService = new ProductService();

