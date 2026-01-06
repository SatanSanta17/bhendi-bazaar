/**
 * useShippingProviders Hook
 * 
 * Custom hook for managing shipping providers in admin UI.
 * Provides state management and operations for provider list.
 */

import { useState, useEffect, useCallback } from "react";
import { shippingService } from "@/services/admin/shippingService";
import type { AdminProviderSummary, ProviderStats } from "@/server/services/admin/shippingService";

export interface UseShippingProvidersReturn {
  // Data
  providers: AdminProviderSummary[];
  stats: ProviderStats;
  
  // Loading states
  loading: boolean;
  toggling: string | null; // ID of provider being toggled
  
  // Error state
  error: string | null;
  
  // Actions
  refreshProviders: () => Promise<void>;
  toggleProvider: (providerId: string, currentStatus: boolean) => Promise<boolean>;
}

export function useShippingProviders(): UseShippingProvidersReturn {
  const [providers, setProviders] = useState<AdminProviderSummary[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    total: 0,
    enabled: 0,
    disabled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch providers from API
   */
  const refreshProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await shippingService.getProviders();

      if (response.success) {
        setProviders(response.providers);
        setStats(response.stats);
      } else {
        setError(response.error || "Failed to fetch providers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle provider enabled/disabled status
   */
  const toggleProvider = useCallback(
    async (providerId: string, currentStatus: boolean): Promise<boolean> => {
      const newStatus = !currentStatus;
      setToggling(providerId);
      setError(null);

      try {
        const response = await shippingService.toggleProvider(providerId, newStatus);

        if (response.success && response.provider) {
          // Update local state optimistically
          setProviders((prev) =>
            prev.map((p) =>
              p.id === providerId ? { ...p, isEnabled: newStatus } : p
            )
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            enabled: newStatus ? prev.enabled + 1 : prev.enabled - 1,
            disabled: newStatus ? prev.disabled - 1 : prev.disabled + 1,
          }));

          return true;
        } else {
          setError(response.error || "Failed to toggle provider");
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        return false;
      } finally {
        setToggling(null);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  return {
    providers,
    stats,
    loading,
    toggling,
    error,
    refreshProviders,
    toggleProvider,
  };
}

