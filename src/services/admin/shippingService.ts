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

export interface ToggleProviderResponse {
  success: boolean;
  provider?: AdminProviderSummary;
  message?: string;
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
        stats: { total: 0, enabled: 0, disabled: 0 },
        error: error instanceof Error ? error.message : "Failed to fetch providers",
      };
    }
  }

  /**
   * Toggle provider enabled/disabled status (Admin)
   */
  async toggleProvider(
    providerId: string,
    isEnabled: boolean
  ): Promise<ToggleProviderResponse> {
    try {
      const response = await fetch(
        `/api/admin/shipping/providers/${providerId}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isEnabled }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle provider");
      }

      return data;
    } catch (error) {
      console.error("ShippingService.toggleProvider error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle provider",
      };
    }
  }
}

// Singleton instance
export const shippingService = new ShippingService();

