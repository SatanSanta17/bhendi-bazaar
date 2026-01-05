"use client";

import { useDisplayItems } from "./hooks/useDisplayItems";
import { SectionHeader } from "../shared/SectionHeader";
import { PriceDisplay } from "../shared/PriceDisplay";
import type { Product } from "@/domain/product";

interface CheckoutSummaryProps {
  buyNowProduct: Product | null;
}

export function CheckoutSummary({ buyNowProduct }: CheckoutSummaryProps) {
  const { displayItems, displaySubtotal, displayDiscount, displayTotal } =
    useDisplayItems(buyNowProduct);

  if (!displayItems.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your basket is empty. Return to the bazaar to add a few treasures first.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <SectionHeader overline="Bill" title="Bill" />
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
      <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <PriceDisplay price={displaySubtotal} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Savings</span>
          <PriceDisplay price={displayDiscount} size="sm" />
        </div>
        <div className="mt-1 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <PriceDisplay price={displayTotal} size="sm" />
        </div>
      </div>
      <p className="pt-1 text-[0.65rem] text-muted-foreground">
        Payment is mocked in this phase – no real charges are made.
      </p>
    </div>
  );
}