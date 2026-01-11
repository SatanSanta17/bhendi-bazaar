/**
 * Shipping Rates Hook
 * 
 * Fetches and manages shipping rate options
 */

import { useState, useCallback } from "react";
import { shippingService } from "@/services/shippingService";
import type { ShippingRate } from "@/domain/shipping";

interface UseShippingRatesResult {
  fetchRates: (pincode: string, weight: number) => Promise<void>;
  rates: ShippingRate[];
  selectedRate: ShippingRate | null;
  selectRate: (rate: ShippingRate) => void;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useShippingRates(): UseShippingRatesResult {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async (pincode: string, weight: number) => {
    setIsLoading(true);
    setError(null);
    setRates([]);
    setSelectedRate(null);

    try {
      const fetchedRates = await shippingService.getRates({
        fromPincode: process.env.WAREHOUSE_PINCODE || "560083",
        toPincode: pincode,
        weight,
        cod: 1,
      });

      setRates(fetchedRates);

      // Auto-select the first available rate (or cheapest)
      if (fetchedRates.length > 0) {
        const cheapest = fetchedRates.reduce((min, rate) =>
          rate.rate < min.rate ? rate : min
        );
        setSelectedRate(cheapest);
      }
    } catch (err) {
      setError("Failed to fetch shipping rates. Please try again.");
      console.error("Shipping rates error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectRate = useCallback((rate: ShippingRate) => {
    setSelectedRate(rate);
  }, []);

  const reset = useCallback(() => {
    setRates([]);
    setSelectedRate(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    fetchRates,
    rates,
    selectedRate,
    selectRate,
    isLoading,
    error,
    reset,
  };
}

