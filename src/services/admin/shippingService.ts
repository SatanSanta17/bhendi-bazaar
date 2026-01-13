/**
 * Client-Side Shipping Service
 * 
 * Service layer for making API calls related to shipping.
 * Used by hooks and components to communicate with backend.
 */

import type { AdminProviderSummary, ProviderStats } from "@/server/services/admin/shippingService";

export interface GetProvidersResponse {
  success: boolean;
  providers: AdminProviderSummary[];
  stats: ProviderStats;
  error?: string;
}

export class ShippingService {
  /**
   * Get all shipping providers (Admin)
   */
  async getProviders(): Promise<GetProvidersResponse> {
    try {
      const response = await fetch("/api/admin/shipping/providers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Always get fresh data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch providers");
      }

      return data;
    } catch (error) {
      console.error("ShippingService.getProviders error:", error);
      return {
        success: false,
        providers: [],
        stats: { total: 0, connected: 0, disconnected: 0 },
        error:
          error instanceof Error ? error.message : "Failed to fetch providers",
      };
    }
  }
}

// Singleton instance
export const shippingService = new ShippingService();

