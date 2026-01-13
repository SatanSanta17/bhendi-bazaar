/**
 * Admin Shipping Service
 * 
 * Server-side service for managing shipping providers (Admin operations).
 * Business logic layer between API routes and repositories.
 */

import { shippingProviderRepository } from "@/server/shipping/repositories";
import type { ShippingProvider } from "@prisma/client";
import { authenticateProvider } from "./provider-auth";
import { ConnectionRequestBody, PROVIDER_FACTORIES } from "@/server/shipping";
import { adminLogRepository } from "@/server/repositories/admin/logRepository";
import { AdminConnectionService } from "./shipping/connection/service";

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
  private adminConnectionService = new AdminConnectionService();
  /**
   * Connect provider account (delegates to connection service)
   */
  async connectProvider(
    providerId: string,
    requestBody: ConnectionRequestBody,
    adminId: string
  ): Promise<AdminProviderSummary> {
    const result = await this.adminConnectionService.connect(
      providerId,
      {
        requestBody,
      },
      adminId
    );

    // Convert to AdminProviderSummary format
    const provider = await shippingProviderRepository.getById(providerId);
    return this.toSafeSummary(provider!);
  }

  /**
   * Disconnect provider account (delegates to connection service)
   */
  async disconnectProvider(
    providerId: string,
    adminId: string
  ): Promise<AdminProviderSummary> {
    await this.adminConnectionService.disconnect(providerId, adminId);

    const provider = await shippingProviderRepository.getById(providerId);
    return this.toSafeSummary(provider!);
  }

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

