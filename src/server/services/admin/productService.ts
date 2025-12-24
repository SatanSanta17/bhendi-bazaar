/**
 * Admin Product Service
 * Business logic for product management
 */

import { adminProductRepository } from "@/server/repositories/admin/productRepository";
import { adminLogRepository } from "@/server/repositories/admin/logRepository";
import type {
  ProductListFilters,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductStats,
  AdminProduct,
} from "@/server/domain/admin/product";

export class AdminProductService {
  /**
   * Get paginated list of products
   */
  async getProducts(filters: ProductListFilters): Promise<ProductListResult> {
    const { products, total } = await adminProductRepository.getProducts(
      filters
    );

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<AdminProduct | null> {
    return await adminProductRepository.getProductById(id);
  }

  /**
   * Create new product
   */
  async createProduct(
    adminId: string,
    data: CreateProductInput
  ): Promise<AdminProduct> {
    // Validate required fields
    if (!data.name || !data.description || !data.categoryId) {
      throw new Error("Name, description, and category are required");
    }

    if (data.price <= 0) {
      throw new Error("Price must be greater than 0");
    }

    if (data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const product = await adminProductRepository.createProduct(data);

    await adminLogRepository.createLog({
      adminId,
      action: "PRODUCT_CREATED",
      resource: "Product",
      resourceId: product.id,
      metadata: { productName: product.name, sku: product.sku },
    });

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    adminId: string,
    data: UpdateProductInput
  ): Promise<AdminProduct | null> {
    // Validate if price is being updated
    if (data.price !== undefined && data.price <= 0) {
      throw new Error("Price must be greater than 0");
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const product = await adminProductRepository.updateProduct(id, data);

    if (product) {
      await adminLogRepository.createLog({
        adminId,
        action: "PRODUCT_UPDATED",
        resource: "Product",
        resourceId: id,
        metadata: { changes: data, productName: product.name },
      });
    }

    return product;
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string, adminId: string): Promise<void> {
    const product = await adminProductRepository.getProductById(id);

    if (!product) {
      throw new Error("Product not found");
    }

    await adminProductRepository.deleteProduct(id);

    await adminLogRepository.createLog({
      adminId,
      action: "PRODUCT_DELETED",
      resource: "Product",
      resourceId: id,
      metadata: { productName: product.name, sku: product.sku },
    });
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(
    updates: { id: string; stock: number }[],
    adminId: string
  ): Promise<void> {
    // Validate all stock values
    for (const update of updates) {
      if (update.stock < 0) {
        throw new Error(`Stock cannot be negative for product ${update.id}`);
      }
    }

    await adminProductRepository.bulkUpdateStock(updates);

    await adminLogRepository.createLog({
      adminId,
      action: "PRODUCTS_BULK_STOCK_UPDATED",
      resource: "Product",
      resourceId: updates.map((u) => u.id).join(","),
      metadata: { count: updates.length },
    });
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    return await adminProductRepository.getProductStats();
  }
}

export const adminProductService = new AdminProductService();


