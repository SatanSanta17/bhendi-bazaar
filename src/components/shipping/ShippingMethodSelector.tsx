/**
 * Shipping Method Selector Component
 * 
 * Displays available shipping options and allows user to select one
 */

"use client";

import { useShippingRates } from "@/hooks/useShippingRates";
import { formatDeliveryEstimate, formatDeliveryDate, getEstimatedDeliveryDate, getShippingMethodName } from "@/utils/shipping";
import { Truck, Clock, Check, Loader2 } from "lucide-react";
import type { ShippingRate } from "@/domain/shipping";

interface ShippingMethodSelectorProps {
  pincode: string;
  weight: number;
  onMethodSelect?: (rate: ShippingRate | null) => void;
  autoFetch?: boolean;
}

export function ShippingMethodSelector({
  pincode,
  weight,
  onMethodSelect,
  autoFetch = true,
}: ShippingMethodSelectorProps) {
  const { fetchRates, rates, selectedRate, selectRate, isLoading, error } = useShippingRates();

  // Auto-fetch rates when pincode/weight changes
  React.useEffect(() => {
    if (autoFetch && pincode && weight > 0) {
      fetchRates(pincode, weight);
    }
  }, [pincode, weight, autoFetch, fetchRates]);

  // Notify parent when selection changes
  React.useEffect(() => {
    if (onMethodSelect) {
      onMethodSelect(selectedRate);
    }
  }, [selectedRate, onMethodSelect]);

  const handleSelectRate = (rate: ShippingRate) => {
    selectRate(rate);
  };

  // Don't show anything if not ready
  if (!pincode || weight <= 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Delivery Options</h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading shipping options...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Delivery Options</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // No rates available
  if (rates.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Delivery Options</h3>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            No shipping options available for this location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">
        Select Delivery Method
      </h3>

      <div className="space-y-2">
        {rates.map((rate) => {
          const isSelected = selectedRate?.providerId === rate.providerId && 
                            selectedRate?.courierName === rate.courierName;
          const deliveryDate = getEstimatedDeliveryDate(rate.estimatedDays);
          const isFree = rate.rate === 0;

          return (
            <button
              key={`${rate.providerId}-${rate.courierName}`}
              type="button"
              onClick={() => handleSelectRate(rate)}
              className={`
                w-full text-left p-4 border-2 rounded-lg transition-all
                ${isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Method info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Truck className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-medium text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                      {rate.courierName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDeliveryEstimate(rate.estimatedDays)}
                      {" • "}
                      By {formatDeliveryDate(deliveryDate)}
                    </span>
                  </div>

                  {/* Features */}
                  {rate.features && (
                    <div className="flex gap-2 mt-2">
                      {rate.features.tracking && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Tracking
                        </span>
                      )}
                      {rate.features.insurance && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Insured
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Price & selection */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-semibold ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                      {isFree ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${rate.rate.toFixed(2)}`
                      )}
                    </div>
                  </div>
                  
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"}
                  `}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedRate && (
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
          <p>
            ✓ Your order will be delivered via <strong>{selectedRate.courierName}</strong>
            {" "}in approximately <strong>{formatDeliveryEstimate(selectedRate.estimatedDays)}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

// Add missing React import
import * as React from "react";

