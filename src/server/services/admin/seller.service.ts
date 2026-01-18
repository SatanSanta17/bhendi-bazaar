// src/server/services/admin/seller.service.ts

import { sellerRepository } from "@/server/repositories/admin/seller.repository";
import type { CreateSellerInput } from "@/domain/seller";

export class AdminSellerService {
  /**
   * Get all sellers with optional stats
   */
  async getAllSellers(includeStats = false) {
    return await sellerRepository.findAll(includeStats);
  }

  /**
   * Get single seller by ID
   */
  async getSeller(id: string) {
    const seller = await sellerRepository.findById(id);
    
    if (!seller) {
      throw new Error("Seller not found");
    }

    return seller;
  }

  /**
   * Create new seller with validation
   */
  async createSeller(data: CreateSellerInput) {
    // Business validation: Check for duplicates
    const existingCode = await sellerRepository.findByCode(data.code);
    if (existingCode) {
      throw new Error("Seller code already exists");
    }

    // Check GST if provided
    if (data.gstNumber) {
      const existingGst = await sellerRepository.findByGstNumber(data.gstNumber);
      if (existingGst) {
        throw new Error("GST number already exists");
      }
    }

    // Create seller
    return await sellerRepository.create(data);
  }

  /**
   * Update seller with validation
   */
  async updateSeller(id: string, data: Partial<CreateSellerInput>) {

    // Validate code uniqueness (if being changed)
    if (data.code) {
      const duplicateCode = await sellerRepository.findByCode(data.code);
      if (duplicateCode) {
        throw new Error("Seller code already exists");
      }
    }

    // Validate email uniqueness (if being changed)
    if (data.email) {
      const duplicateEmail = await sellerRepository.findByEmail(data.email);
      if (duplicateEmail) {
        throw new Error("Email already exists");
      }
    }

    // Validate GST uniqueness (if being changed)
    if (data.gstNumber) {
      const duplicateGst = await sellerRepository.findByGstNumber(data.gstNumber);
      if (duplicateGst) {
        throw new Error("GST number already exists");
      }
    }

    // Update seller
    return await sellerRepository.update(id, data);
  }

  /**
   * Delete seller with business rules
   */
  async deleteSeller(id: string) {
    // Check if seller exists
    const seller = await sellerRepository.findById(id);
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Business rule: Cannot delete seller with products
    const productCount = await sellerRepository.countProducts(id);
    if (productCount > 0) {
      throw new Error(
        `Cannot delete seller with products. This seller has ${productCount} product(s). Please reassign or delete them first.`
      );
    }

    // Delete seller
    return await sellerRepository.delete(id);
  }
}

export const adminSellerService = new AdminSellerService();