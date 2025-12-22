"use client";

import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/format";

export function CheckoutSummary() {
  const items = useCartStore((state) => state.items);
  const buyNowItem = useCartStore((state) => state.buyNowItem);
  const subtotal = useCartStore((state) => state.subtotal);
  const discount = useCartStore((state) => state.discount);
  const total = useCartStore((state) => state.total);

  const displayItems = buyNowItem ? [buyNowItem] : items;

  const displaySubtotal = buyNowItem
    ? buyNowItem.price * buyNowItem.quantity
    : subtotal;
  const displayDiscount =
    buyNowItem && buyNowItem.salePrice
      ? (buyNowItem.price - buyNowItem.salePrice) * buyNowItem.quantity
      : discount;
  const displayTotal = buyNowItem
    ? (buyNowItem.salePrice ?? buyNowItem.price) * buyNowItem.quantity
    : total;

  if (!displayItems.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your basket is empty. Return to the bazaar to add a few treasures first.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Bill
        </p>
      </header>
      <div className="space-y-1 text-xs">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="line-clamp-1 text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span>
              {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(displaySubtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Savings</span>
          <span className="text-emerald-700">
            −{formatCurrency(displayDiscount)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatCurrency(displayTotal)}</span>
        </div>
      </div>
      <p className="pt-1 text-[0.65rem] text-muted-foreground">
        Payment is mocked in this phase – no real charges are made.
      </p>
    </div>
  );
}