/**
 * Admin Shipping Service
 * 
 * Server-side service for managing shipping providers (Admin operations).
 * Business logic layer between API routes and repositories.
 */

import { shippingProviderRepository } from "@/server/shipping/repositories";
import type { ShippingProvider } from "@prisma/client";

export interface AdminProviderSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  priority: number;
  supportedModes: string[];
  serviceablePincodes: string[];
  logoUrl: string | null;
  websiteUrl: string | null;
  hasConfig: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderStats {
  total: number;
  enabled: number;
  disabled: number;
}

export class AdminShippingService {
  /**
   * Get all providers (safe for admin view - no sensitive config)
   */
  async getAllProviders(): Promise<AdminProviderSummary[]> {
    const providers = await shippingProviderRepository.getAllProviders();

    return providers.map((provider) => this.toSafeSummary(provider));
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(): Promise<ProviderStats> {
    return await shippingProviderRepository.getProviderStats();
  }

  /**
   * Toggle provider enabled status
   */
  async toggleProvider(
    providerId: string,
    isEnabled: boolean,
    adminId: string
  ): Promise<AdminProviderSummary> {
    // Validate provider exists
    const provider = await shippingProviderRepository.getById(providerId);
    
    if (!provider) {
      throw new Error("Provider not found");
    }

    // Toggle status
    const updated = await shippingProviderRepository.toggleEnabled(
      providerId,
      isEnabled
    );

    // Log admin action (imported separately to avoid circular dependency)
    try {
      const { adminLogRepository } = await import("@/server/repositories/admin/logRepository");
      await adminLogRepository.createLog({
        adminId,
        action: isEnabled ? "PROVIDER_ENABLED" : "PROVIDER_DISABLED",
        resource: "ShippingProvider",
        resourceId: providerId,
        metadata: {
          providerCode: updated.code,
          providerName: updated.name,
          previousStatus: provider.isEnabled,
          newStatus: isEnabled,
        },
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
      // Don't throw - logging failure shouldn't break the operation
    }

    return this.toSafeSummary(updated);
  }

  /**
   * Get provider by ID (safe summary)
   */
  async getProviderById(providerId: string): Promise<AdminProviderSummary | null> {
    const provider = await shippingProviderRepository.getById(providerId);
    
    if (!provider) {
      return null;
    }

    return this.toSafeSummary(provider);
  }

  /**
   * Transform provider to safe summary (hide sensitive config)
   */
  private toSafeSummary(provider: ShippingProvider): AdminProviderSummary {
    return {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      description: provider.description,
      isEnabled: provider.isEnabled,
      priority: provider.priority,
      supportedModes: provider.supportedModes,
      serviceablePincodes: provider.serviceablePincodes,
      logoUrl: provider.logoUrl,
      websiteUrl: provider.websiteUrl,
      hasConfig: !!provider.config && Object.keys(provider.config as object).length > 0,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}

// Singleton instance
export const adminShippingService = new AdminShippingService();

