// src/hooks/shipping/useMultiShippingRates.ts

import { useState, useCallback, useMemo } from "react";
import { shippingService } from "@/services/shippingService";
import type { CartItem } from "@/domain/cart";
import type { ShippingGroup, ShippingRate, GetShippingRatesRequest } from "@/domain/shipping";
import { 
  groupItemsByOrigin, 
  calculateTotalShipping, 
  areAllGroupsReady 
} from "@/utils/shipping";

export interface UseMultiShippingRatesReturn {
  // Data
  groups: ShippingGroup[];
  totalShippingCost: number;
  isAllGroupsReady: boolean;
  
  // State
  isLoading: boolean;
  
  // Actions
  fetchAllRates: (items: CartItem[], toPincode: string) => Promise<void>;
  selectRateForGroup: (groupId: string, rate: ShippingRate) => void;
  reset: () => void;
}

export function useMultiShippingRates(): UseMultiShippingRatesReturn {
  const [groups, setGroups] = useState<ShippingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rates for all groups
  const fetchAllRates = useCallback(
    async (items: CartItem[], toPincode: string) => {
      if (items.length === 0) {
        setGroups([]);
        return;
      }
      
      // Group items by origin
      const initialGroups = groupItemsByOrigin(items);
      setIsLoading(true);
      
      try {
        // Fetch rates for each group in parallel
        const updatedGroups = await Promise.all(
          initialGroups.map(async (group) => {
            // Mark group as loading
            const updatedGroup = { ...group, isLoading: true };
            
            try {
              const request: GetShippingRatesRequest = {
                fromPincode: group.fromPincode,
                toPincode,
                weight: group.totalWeight,
                cod: false,
              };
              
              const response = await shippingService.getRates(request);
              
              return {
                ...updatedGroup,
                rates: response.rates,
                selectedRate: response.defaultRate ?? response.rates[0] ?? null,
                serviceable: response.success && response.rates.length > 0,
                isLoading: false,
                error: null,
              };
            } catch (error) {
              return {
                ...updatedGroup,
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to fetch rates",
                serviceable: false,
              };
            }
          })
        );
        
        setGroups(updatedGroups);
      } finally {
        setIsLoading(false);
      }
    },
    [shippingService]
  );
  
  // Select rate for a specific group
  const selectRateForGroup = useCallback((groupId: string, rate: ShippingRate) => {
    setGroups(prev => 
      prev.map(group => 
        group.groupId === groupId
          ? { ...group, selectedRate: rate }
          : group
      )
    );
  }, []);
  
  // Reset state
  const reset = useCallback(() => {
    setGroups([]);
    setIsLoading(false);
  }, []);
  
  // Calculate derived values
  const totalShippingCost = calculateTotalShipping(groups);
  const isAllGroupsReady = areAllGroupsReady(groups);
  
  return {
    groups,
    totalShippingCost,
    isAllGroupsReady,
    isLoading,
    fetchAllRates,
    selectRateForGroup,
    reset,
  };
}
