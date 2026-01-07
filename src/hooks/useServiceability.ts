/**
 * Pincode Serviceability Checker Hook
 * 
 * Checks if delivery is available to a given pincode
 */

import { useState, useCallback } from "react";
import { shippingService } from "@/services/shippingService";
import { isValidPincode } from "@/utils/shipping";
import type { ServiceabilityResponse } from "@/domain/shipping";

interface UseServiceabilityResult {
  checkServiceability: (pincode: string) => Promise<void>;
  isChecking: boolean;
  result: ServiceabilityResponse | null;
  error: string | null;
  reset: () => void;
}

export function useServiceability(): UseServiceabilityResult {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ServiceabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkServiceability = useCallback(async (pincode: string) => {
    // Validate pincode format first
    if (!isValidPincode(pincode)) {
      setError("Please enter a valid 6-digit pincode");
      setResult(null);
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await shippingService.checkServiceability(pincode);
      setResult(response);
      
      if (!response.serviceable) {
        setError(response.message || "Delivery not available to this pincode");
      }
    } catch (err) {
      setError("Failed to check serviceability. Please try again.");
      console.error("Serviceability check error:", err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsChecking(false);
  }, []);

  return {
    checkServiceability,
    isChecking,
    result,
    error,
    reset,
  };
}

