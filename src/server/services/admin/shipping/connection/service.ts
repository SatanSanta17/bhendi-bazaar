// src/server/services/admin/shipping/connection/service.ts

/**
 * Admin Connection Service
 * 
 * Admin layer for connecting shipping providers.
 * Delegates actual connection logic to shipping providers.
 */

import { shippingProviderRepository } from "@/server/shipping/repositories";
import { PROVIDER_FACTORIES } from "@/server/shipping";
import { adminLogRepository } from "@/server/repositories/admin/logRepository";
import { encryptionService } from "@/server/shipping/utils/encryption";
import type { ProviderConnectionResult,ConnectionRequestBody } from "@/server/shipping/domain/shipping.types";
import type { AdminConnectionRequest, AdminConnectionResult, AdminDisconnectionRequest } from "./types";

export class AdminConnectionService {
  /**
   * Connect a provider account (Admin operation)
   */
  async connect(
    providerId: string,
    request: AdminConnectionRequest,
    adminId: string
  ): Promise<AdminConnectionResult> {
    // 1. Validate provider exists
    const provider = await shippingProviderRepository.getById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    // 2. Get provider factory and create instance
    const factory = PROVIDER_FACTORIES[provider.code as keyof typeof PROVIDER_FACTORIES];
    if (!factory) {
      throw new Error(`Provider implementation not found: ${provider.code}`);
    }

    const providerInstance = factory();

    // 3. Convert admin request to provider credentials
    const credentials = this.mapToProviderCredentials(request.requestBody);

    // 4. Call provider's connect method (shipping layer)
    let connectionResult: ProviderConnectionResult;
    try {
      connectionResult = await providerInstance.connect(credentials);
    } catch (error) {
      // Update error in database
      await shippingProviderRepository.update(providerId, {
        authError: error instanceof Error ? error.message : "Connection failed",
      });
      throw error;
    }

    // 5. Store encrypted credentials in database
    const updated = await shippingProviderRepository.connectAccount(providerId, {
      email: connectionResult.accountInfo.email,
      password: credentials.type === "email_password" ? credentials.password : "",
      authToken: connectionResult.token,
      tokenExpiresAt: connectionResult.tokenExpiresAt,
      accountInfo: connectionResult.accountInfo,
      connectedBy: adminId,
    });

    // 6. Log admin action
    await adminLogRepository.createLog({
      adminId,
      action: "PROVIDER_CONNECTED",
      resource: "ShippingProvider",
      resourceId: providerId,
      metadata: {
        providerCode: provider.code,
        email: connectionResult.accountInfo.email,
      },
    });
    // 7. Return admin-safe result
    return {
      success: true,
      provider: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        isConnected: updated.isConnected,
        connectedAt: updated.connectedAt,
        isAuthenticated: updated.tokenExpiresAt && updated.tokenExpiresAt > new Date() ? true : false,
        authenticatedBy:adminId,
        lastAuthAt: updated.lastAuthAt,
        accountEmail: connectionResult.accountInfo.email,
        accountName: connectionResult.accountInfo.firstName && connectionResult.accountInfo.lastName
          ? `${connectionResult.accountInfo.firstName} ${connectionResult.accountInfo.lastName}`
          : null,
        priority: updated.priority,
        supportedModes: updated.supportedModes,
        logoUrl: updated.logoUrl,
        websiteUrl: updated.websiteUrl,
        updatedAt: updated.updatedAt,
        createdAt: updated.createdAt,
      },
    };
  }

  /**
   * Disconnect a provider account (Admin operation)
   */
  async disconnect(providerId: string, adminId: string): Promise<AdminDisconnectionRequest> {
    const provider = await shippingProviderRepository.getById(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    if (!provider.isConnected) {
      throw new Error("Provider is not connected");
    }

    const updated = await shippingProviderRepository.disconnectAccount(providerId);

    await adminLogRepository.createLog({
      adminId,
      action: "PROVIDER_DISCONNECTED",
      resource: "ShippingProvider",
      resourceId: providerId,
      metadata: {
        providerCode: provider.code,
      },
    });
    return {
      success: true,
      provider: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        isConnected: updated.isConnected,
        websiteUrl: updated.websiteUrl,
        updatedAt: updated.updatedAt,
        createdAt: updated.createdAt,
      },
    };
  }

  /**
   * Map admin request to provider credentials format
   */
  private mapToProviderCredentials(
    requestCredentials: ConnectionRequestBody
  ): ConnectionRequestBody {
    // This handles the mapping from admin request to provider format
    // Can be extended for different credential types
    return requestCredentials;
  }
}

// Singleton instance
export const adminConnectionService = new AdminConnectionService();