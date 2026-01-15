// src/components/checkoutContainer/components/ShippingRatesSection.tsx

"use client";

import {
  Truck,
  Clock,
  Shield,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingRate } from "@/domain/shipping";

interface ShippingRatesSectionProps {
  serviceable: boolean | null; // null = checking, true = yes, false = no
  rates: ShippingRate[];
  selectedRate: ShippingRate | null;
  onRateSelect: (rate: ShippingRate) => void;
  loading: boolean;
  error: string | null;
}

export function ShippingRatesSection({
  serviceable,
  rates,
  selectedRate,
  onRateSelect,
  loading,
  error,
}: ShippingRatesSectionProps) {
  // Loading state - checking serviceability
  if (loading || serviceable === null) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Method
        </label>
        <div className="flex items-center justify-center rounded-xl border border-border/70 bg-card/80 p-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking delivery options...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Method
        </label>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900">
                Unable to check delivery options
              </p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not serviceable - show message
  if (serviceable === false || rates.length === 0) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Method
        </label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-900">
                Delivery not available to this location
              </p>
              <p className="text-xs text-amber-700">
                We're unable to deliver to the selected address. Please choose a
                different delivery address.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show available rates
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
        Delivery Method
      </label>

      <div className="space-y-2">
        {rates.map((rate) => {
          const isSelected =
            selectedRate?.providerId === rate.providerId &&
            selectedRate?.courierName === rate.courierName;
          const isFree = rate.rate === 0;

          return (
            <button
              key={`${rate.providerId}-${rate.courierName}`}
              type="button"
              onClick={() => onRateSelect(rate)}
              className={cn(
                "group relative w-full rounded-xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border/70 bg-card/80 hover:border-border hover:bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Courier info */}
                <div className="flex-1 space-y-2">
                  {/* Courier name */}
                  <div className="flex items-center gap-2">
                    <Truck
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {rate.courierName}
                    </span>
                  </div>

                  {/* Estimated delivery */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Delivers in{" "}
                      {rate.estimatedDays === 1
                        ? "1 day"
                        : `${rate.estimatedDays} days`}
                    </span>
                  </div>

                  {/* Features */}
                  {rate.features && (
                    <div className="flex flex-wrap gap-1.5">
                      {rate.features?.tracking && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          <Package className="h-3 w-3" />
                          Tracking
                        </span>
                      )}
                      {rate.features?.insurance && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          Insured
                        </span>
                      )}
                      {rate.features?.cod && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          COD Available
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Price & selection */}
                <div className="flex flex-col items-end gap-2">
                  {/* Price */}
                  <div
                    className={cn(
                      "text-base font-bold",
                      isFree
                        ? "text-green-600"
                        : isSelected
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {isFree ? "FREE" : `₹${rate.rate.toFixed(0)}`}
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected rate summary */}
      {selectedRate && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>
            ✓ Your order will be delivered via{" "}
            <span className="font-semibold text-foreground">
              {selectedRate.courierName}
            </span>{" "}
            in approximately{" "}
            <span className="font-semibold text-foreground">
              {selectedRate.estimatedDays === 1
                ? "1 day"
                : `${selectedRate.estimatedDays} days`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
