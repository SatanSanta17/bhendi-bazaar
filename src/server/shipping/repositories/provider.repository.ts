/**
 * ShippingProvider Repository
 * 
 * Handles all database operations for the ShippingProvider model.
 * Manages provider configuration, enablement, and queries.
 */

import { prisma } from "@/lib/prisma";
import type { ShippingProvider, Prisma } from "@prisma/client";

export class ShippingProviderRepository {
  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get all enabled providers ordered by priority (highest first)
   */
  async getEnabledProviders(): Promise<ShippingProvider[]> {
    return await prisma.shippingProvider.findMany({
      where: { isEnabled: true },
      orderBy: { priority: "desc" },
    });
  }

  /**
   * Get all providers (enabled and disabled)
   */
  async getAllProviders(): Promise<ShippingProvider[]> {
    return await prisma.shippingProvider.findMany({
      orderBy: { priority: "desc" },
    });
  }

  /**
   * Get provider by unique code
   */
  async getByCode(code: string): Promise<ShippingProvider | null> {
    return await prisma.shippingProvider.findUnique({
      where: { code },
    });
  }

  /**
   * Get provider by ID
   */
  async getById(id: string): Promise<ShippingProvider | null> {
    return await prisma.shippingProvider.findUnique({
      where: { id },
    });
  }

  /**
   * Get providers that support a specific shipping mode
   */
  async getProvidersByMode(mode: string): Promise<ShippingProvider[]> {
    return await prisma.shippingProvider.findMany({
      where: {
        isEnabled: true,
        supportedModes: {
          has: mode,
        },
      },
      orderBy: { priority: "desc" },
    });
  }

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  /**
   * Create a new shipping provider
   */
  async create(
    data: Prisma.ShippingProviderCreateInput
  ): Promise<ShippingProvider> {
    return await prisma.shippingProvider.create({ data });
  }

  /**
   * Bulk create providers (useful for seeding)
   */
  async createMany(
    data: Prisma.ShippingProviderCreateManyInput[]
  ): Promise<number> {
    const result = await prisma.shippingProvider.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }

  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================

  /**
   * Update provider configuration
   */
  async update(
    id: string,
    data: Prisma.ShippingProviderUpdateInput
  ): Promise<ShippingProvider> {
    return await prisma.shippingProvider.update({
      where: { id },
      data,
    });
  }

  /**
   * Toggle provider enabled/disabled status
   */
  async toggleEnabled(
    id: string,
    isEnabled: boolean
  ): Promise<ShippingProvider> {
    return await prisma.shippingProvider.update({
      where: { id },
      data: { isEnabled },
    });
  }

  /**
   * Update provider priority
   */
  async updatePriority(id: string, priority: number): Promise<ShippingProvider> {
    return await prisma.shippingProvider.update({
      where: { id },
      data: { priority },
    });
  }

  /**
   * Update provider configuration (API keys, settings)
   */
  async updateConfig(
    id: string,
    config: Prisma.InputJsonValue
  ): Promise<ShippingProvider> {
    return await prisma.shippingProvider.update({
      where: { id },
      data: { config },
    });
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  /**
   * Delete a provider (use with caution - may have related records)
   */
  async delete(id: string): Promise<void> {
    await prisma.shippingProvider.delete({
      where: { id },
    });
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Check if provider can service a specific pincode
   * @returns true if serviceable, false otherwise
   */
  async canServicePincode(
    providerId: string,
    pincode: string
  ): Promise<boolean> {
    const provider = await this.getById(providerId);
    if (!provider || !provider.isEnabled) return false;

    // Empty array means all India is serviceable
    if (provider.serviceablePincodes.length === 0) return true;

    // Check if pincode is in serviceable list
    return provider.serviceablePincodes.includes(pincode);
  }

  /**
   * Check if provider exists
   */
  async exists(code: string): Promise<boolean> {
    const count = await prisma.shippingProvider.count({
      where: { code },
    });
    return count > 0;
  }

  /**
   * Get provider count by status
   */
  async getProviderStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
  }> {
    const [total, enabled] = await Promise.all([
      prisma.shippingProvider.count(),
      prisma.shippingProvider.count({ where: { isEnabled: true } }),
    ]);

    return {
      total,
      enabled,
      disabled: total - enabled,
    };
  }
}

// Singleton instance
export const shippingProviderRepository = new ShippingProviderRepository();
