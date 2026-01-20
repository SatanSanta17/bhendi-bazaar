// server/services/admin/productService.ts

import { productsRepository } from "@server/admin/repository/products.repository";
import { ProductFilters, ProductFormInput } from "@server/admin/types/products.types";

export class ProductsService {  
  async getProducts(filters: ProductFilters) {
    return await productsRepository.getProducts(filters);
  }
  
  async getStats() {
    return await productsRepository.getStats();
  }

  async deleteProduct(id: string) {
    return await productsRepository.deleteProduct(id);
  }

  async createProduct(data: ProductFormInput) {
    return await productsRepository.createProduct(data);
  }
}

export const productsService = new ProductsService();