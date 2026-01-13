/**
 * useShippingProviders Hook
 * 
 * Custom hook for managing shipping providers in admin UI.
 * Provides state management and operations for provider list.
 */

import { useState, useEffect, useCallback } from "react";
import { shippingProviderService } from "@/components/admin/shipping/providersContainer/services/shippingProviderService";
import type { ConnectionRequestBody, ShippingProvider, ShippingProviderStats } from "../types";

export interface UseShippingProvidersReturn {
  // Data
  providers: ShippingProvider[];
  stats: ShippingProviderStats;

  // Loading states
  isLoading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Error state
  error: string | null;

  // Actions
  refreshProviders: () => Promise<void>;
  connectProvider: (providerId: string, requestBody: ConnectionRequestBody) => Promise<boolean>;
  disconnectProvider: (providerId: string) => Promise<boolean>;
}

export function useShippingProviders(): UseShippingProvidersReturn {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [stats, setStats] = useState<ShippingProviderStats>({
    total: 0,
    connected: 0,
    disconnected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch providers from API
   */
  const refreshProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shippingProviderService.getProviders();

      if (response.success) {
        setProviders(response.providers);
        setStats(response.stats);
      } else {
        setError(response.error || "Failed to fetch providers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Connect a provider account
   */
  const connectProvider = useCallback(
    async (providerId: string, requestBody: ConnectionRequestBody) => {
      setIsConnecting(true);
      setError(null);

      try {
        const response = await shippingProviderService.connectProvider(
          providerId,
          requestBody
        );
        if (response.success && response.provider) {
          setProviders((prev) =>
            prev.map((provider) =>
              provider.id === providerId ? response.provider as ShippingProvider : provider
            )
          );
          setStats((prev) => ({
            ...prev,
            connected: prev.connected + 1,
            disconnected: prev.disconnected - 1,
          }));
          return true;
        } else {
          setError(response.error || "Failed to connect provider");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  /**
   * Disconnect a provider account
   */
  const disconnectProvider = useCallback(async (providerId: string) => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await shippingProviderService.disconnectProvider(providerId);
      if (response.success && response.provider) {
        setProviders((prev) =>
          prev.map((provider) =>
            provider.id === providerId ? response.provider as ShippingProvider : provider
          )
        );
        setStats((prev) => ({
          ...prev,
          connected: prev.connected - 1,
          disconnected: prev.disconnected + 1,
        }));
        return true;
      } else {
        setError(response.error || "Failed to disconnect provider");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  return {
    providers,
    stats,
    isLoading,
    isConnecting,
    isDisconnecting,
    error,
    refreshProviders,
    connectProvider,
    disconnectProvider,
  };
}

