// src/hooks/shipping/useShippingRates.ts

import { useState, useCallback } from "react";
import { shippingService } from "@/services/shippingService";
import type { GetShippingRatesRequest, ShippingRate } from "@/domain/shipping";

export interface UseShippingRatesOptions {
  autoSelectCheapest?: boolean; // Auto-select cheapest rate
  autoSelectFastest?: boolean;  // Auto-select fastest rate
  autoSelectBalanced?: boolean;  // Auto-select default rate
}

export interface UseShippingRatesReturn {
  // Data
  serviceable: boolean;
  rates: ShippingRate[];
  selectedRate: ShippingRate | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchRates: (request: GetShippingRatesRequest) => Promise<void>;
  selectRate: (rate: ShippingRate) => void;
  clearSelection: () => void;
  reset: () => void;
}

export function useShippingRates(): UseShippingRatesReturn {
  const [serviceable, setServiceable] = useState<boolean>(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(
    async (request: GetShippingRatesRequest) => {
      setLoading(true);
      setError(null);

      try {
        // console.log("Fetching shipping rates for request: ", JSON.stringify(request, null, 2));
        const response = await shippingService.getRates(request);
        setRates(response.rates);

        // Auto-select based on options
        if (response.rates.length > 0) {
          setSelectedRate(response.defaultRate ?? response.rates[0]);
          setServiceable(response.success);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch shipping rates";
        setError(message);
        setServiceable(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const selectRate = useCallback((rate: ShippingRate) => {
    setSelectedRate(rate);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRate(null);
  }, []);

  const reset = useCallback(() => {
    setServiceable(false);
    setRates([]);
    setSelectedRate(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    serviceable,
    rates,
    selectedRate,
    loading,
    error,
    fetchRates,
    selectRate,
    clearSelection,
    reset,
  };
}