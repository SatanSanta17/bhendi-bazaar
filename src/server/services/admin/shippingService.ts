/**
 * Admin Shipping Service
 * 
 * Server-side service for managing shipping providers (Admin operations).
 * Business logic layer between API routes and repositories.
 */

import { shippingProviderRepository } from "@/server/shipping/repositories";
import type { ShippingProvider } from "@prisma/client";
import { authenticateProvider } from "./provider-auth";
import { PROVIDER_FACTORIES } from "@/server/shipping";
import { adminLogRepository } from "@/server/repositories/admin/logRepository";

export interface AdminProviderSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isConnected: boolean;
  connectedAt: Date | null;
  lastAuthAt: Date | null;
  accountEmail: string | null;
  accountName: string | null;
  priority: number;
  supportedModes: string[];
  serviceablePincodes: string[];
  logoUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderStats {
  total: number;
  connected: number;
  disconnected: number;
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
   * Get provider by ID (safe summary)
   */
  async getProviderById(
    providerId: string
  ): Promise<AdminProviderSummary | null> {
    const provider = await shippingProviderRepository.getById(providerId);

    if (!provider) {
      return null;
    }

    return this.toSafeSummary(provider);
  }
  // src/server/services/admin/shippingService.ts

  /**
   * Connect provider account
   */
  async connectProvider(
    providerId: string,
    credentials: {
      email: string;
      password: string;
      warehousePincode?: string;
    },
    adminId: string
  ): Promise<AdminProviderSummary> {
    // 1. Validate provider exists
    const factory =
      PROVIDER_FACTORIES[providerId as keyof typeof PROVIDER_FACTORIES];
    if (!factory) {
      throw new Error("Provider not found");
    }

    // 2. Authenticate with provider API
    const providerInstance = factory();

    if (!providerInstance) {
      throw new Error("Provider implementation not found");
    }

    // 3. Test authentication
    const authResult = await authenticateProvider(
      providerInstance,
      credentials.email,
      credentials.password
    );

    // 4. Store encrypted credentials
    const updated = await shippingProviderRepository.connectAccount(
      providerId,
      {
        email: credentials.email,
        password: credentials.password,
        authToken: authResult.token,
        tokenExpiresAt: authResult.expiresAt,
        accountInfo: {
          email: authResult.accountInfo.email,
          firstName: authResult.accountInfo.firstName,
          lastName: authResult.accountInfo.lastName,
          companyId: authResult.accountInfo.companyId,
        },
        connectedBy: adminId,
      }
    );

    // 5. Log admin action
    await adminLogRepository.createLog({
      adminId,
      action: "PROVIDER_CONNECTED",
      resource: "ShippingProvider",
      resourceId: providerId,
      metadata: {
        providerCode: updated.code,
        email: credentials.email,
      },
    });

    return this.toSafeSummary(updated);
  }

  /**
   * Disconnect provider account
   */
  async disconnectProvider(
    providerId: string,
    adminId: string
  ): Promise<AdminProviderSummary> {
    const provider = await shippingProviderRepository.getById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    if (!provider.isConnected) {
      throw new Error("Provider is not connected");
    }

    const updated = await shippingProviderRepository.disconnectAccount(
      providerId
    );

    await adminLogRepository.createLog({
      adminId,
      action: "PROVIDER_DISCONNECTED",
      resource: "ShippingProvider",
      resourceId: providerId,
      metadata: {
        providerCode: provider.code,
      },
    });

    return this.toSafeSummary(updated);
  }
  /**
   * Update safe summary to include connection status
   */
  private toSafeSummary(provider: ShippingProvider): AdminProviderSummary {
    const accountInfo = provider.accountInfo as any;

    return {
      id: provider.id,
      code: provider.code,
      name: provider.name,
      description: provider.description,
      isConnected: provider.isConnected,
      connectedAt: provider.connectedAt,
      lastAuthAt: provider.lastAuthAt,
      accountEmail: accountInfo?.email || null,
      accountName: accountInfo
        ? `${accountInfo.firstName || ""} ${accountInfo.lastName || ""}`.trim()
        : null,
      priority: provider.priority,
      supportedModes: provider.supportedModes,
      serviceablePincodes: provider.serviceablePincodes,
      logoUrl: provider.logoUrl,
      websiteUrl: provider.websiteUrl,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}

// Singleton instance
export const adminShippingService = new AdminShippingService();

