"use client";

import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CartLineItems() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your cart is quiet right now. Start with an emerald abaya or a scented
        attar from the Home page.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3 text-sm"
        >
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.size && <span>Size {item.size}</span>}
              {item.color && <span>· {item.color}</span>}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-semibold">
                {formatCurrency(item.salePrice ?? item.price)}
              </span>
              {item.salePrice && item.salePrice < item.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(item.price)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center rounded-full border border-border/70 bg-background px-2 py-1 text-xs">
              <button
                type="button"
                className="px-2 text-muted-foreground"
                onClick={() =>
                  updateQuantity(item.id, Math.max(0, item.quantity - 1))
                }
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-xs">
                {item.quantity}
              </span>
              <button
                type="button"
                className="px-2 text-muted-foreground"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.id)}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}


