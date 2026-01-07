/**
 * Enhanced Checkout Summary with Shipping Cost
 * 
 * Displays order summary including shipping charges
 */

"use client";

import { useDisplayItems } from "./hooks/useDisplayItems";
import { SectionHeader } from "../shared/SectionHeader";
import { PriceDisplay } from "../shared/PriceDisplay";
import { Truck } from "lucide-react";
import type { Product } from "@/domain/product";
import type { ShippingRate } from "@/domain/shipping";

interface CheckoutSummaryProps {
  buyNowProduct: Product | null;
  shippingMethod?: ShippingRate | null;
}

export function CheckoutSummaryWithShipping({ 
  buyNowProduct,
  shippingMethod 
}: CheckoutSummaryProps) {
  const { displayItems, displaySubtotal, displayDiscount, displayTotal } =
    useDisplayItems(buyNowProduct);

  const shippingCost = shippingMethod?.rate || 0;
  const finalTotal = displayTotal + shippingCost;

  if (!displayItems.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your basket is empty. Return to the bazaar to add a few treasures first.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <SectionHeader overline="Bill" title="Order Summary" />
      
      {/* Items List */}
      <div className="space-y-1 text-xs">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="line-clamp-1 text-muted-foreground">
              {item.productName} × {item.quantity}
            </span>
            <PriceDisplay price={item.price * item.quantity} size="sm" />
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <PriceDisplay price={displaySubtotal} size="sm" />
        </div>
        
        {displayDiscount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Savings</span>
            <span className="font-medium">- ₹{displayDiscount.toFixed(2)}</span>
          </div>
        )}

        {/* Shipping Cost */}
        {shippingMethod ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Shipping</span>
            </div>
            {shippingCost === 0 ? (
              <span className="font-medium text-green-600">FREE</span>
            ) : (
              <span className="text-muted-foreground">₹{shippingCost.toFixed(2)}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-amber-600">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span className="text-xs">Shipping</span>
            </div>
            <span className="text-xs">To be calculated</span>
          </div>
        )}

        {/* Shipping Method Details */}
        {shippingMethod && (
          <div className="text-[0.65rem] text-muted-foreground pt-1">
            <div className="flex items-start gap-1">
              <span>via {shippingMethod.courierName}</span>
              <span>•</span>
              <span>{shippingMethod.estimatedDays} days</span>
            </div>
          </div>
        )}

        {/* Final Total */}
        <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2 text-sm font-semibold">
          <span>Total</span>
          <PriceDisplay price={finalTotal} size="sm" />
        </div>
      </div>

      <p className="pt-1 text-[0.65rem] text-muted-foreground">
        Shipping charges are calculated based on your location and selected delivery method.
      </p>
    </div>
  );
}

