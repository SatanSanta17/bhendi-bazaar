// server/services/admin/productService.ts

import { AdminProductRepository } from "@server/repositories/admin/productRepository";
import { ProductFilters } from "@server/domain/admin/product";

export class AdminProductService {
  private repository = new AdminProductRepository();
  
  // ✅ Read operations (cached)
  async getProducts(filters: ProductFilters) {
    return await this.repository.getProducts(filters);
  }
  
  async getProductById(id: string) {
    const product = await this.repository.getProductById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  async getStats() {
    return await this.repository.getStats();
  }

  async deleteProduct(id: string) {
    return await this.repository.deleteProduct(id);
  }
}

export const adminProductService = new AdminProductService();