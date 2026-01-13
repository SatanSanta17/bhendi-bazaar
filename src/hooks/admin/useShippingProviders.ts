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

  // Error state
  error: string | null;

  // Actions
  refreshProviders: () => Promise<void>;
}

export function useShippingProviders(): UseShippingProvidersReturn {
  const [providers, setProviders] = useState<AdminProviderSummary[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    total: 0,
    connected: 0,
    disconnected: 0,
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

  // Initial load
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  return {
    providers,
    stats,
    loading,
    error,
    refreshProviders,
  };
}

