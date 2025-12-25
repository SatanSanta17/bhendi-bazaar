// UPDATED: cart-line-items.tsx

"use client";

import { useCartStore } from "@/store/cartStore";
import { CartItem } from "./CartItem";

export function CartLineItems() {
  const items = useCartStore((state) => state.items);

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
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}
