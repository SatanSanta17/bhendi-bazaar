/**
 * Admin Product Service (Client-side)
 * Handles API calls for product management
 */

import type {
  AdminProduct,
  ProductListFilters,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
} from "@/domain/admin";

class AdminProductService {
  /**
   * Get paginated list of products
   */
  async getProducts(
    filters: ProductListFilters = {}
  ): Promise<ProductListResult> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.isFeatured) params.append("isFeatured", "true");
    if (filters.isOnOffer) params.append("isOnOffer", "true");
    if (filters.lowStock) params.append("lowStock", "true");
    if (filters.outOfStock) params.append("outOfStock", "true");
    if (filters.minPrice) params.append("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.append("maxPrice", String(filters.maxPrice));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await fetch(`/api/admin/products?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch products");
    }

    return response.json();
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<AdminProduct> {
    const response = await fetch(`/api/admin/products/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch product");
    }

    return response.json();
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductInput): Promise<AdminProduct> {
    const response = await fetch(`/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create product");
    }

    return response.json();
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    data: UpdateProductInput
  ): Promise<AdminProduct> {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update product");
    }

    return response.json();
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete product");
    }
  }
}

export const adminProductService = new AdminProductService();


