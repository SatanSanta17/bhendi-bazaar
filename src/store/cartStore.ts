import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { CartItem, CartState } from "@/domain/cart";

type CartStoreState = CartState & {
  subtotal: number;
  discount: number;
  total: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

function computeTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = items.reduce(
    (sum, item) =>
      sum +
      (item.salePrice ? (item.price - item.salePrice) * item.quantity : 0),
    0
  );
  return { subtotal, discount, total: subtotal - discount };
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,

      addItem: (itemInput) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === itemInput.productId &&
              i.size === itemInput.size &&
              i.color === itemInput.color
          );

          let nextItems: CartItem[];

          if (existing) {
            nextItems = state.items.map((i) =>
              i === existing
                ? { ...i, quantity: i.quantity + itemInput.quantity }
                : i
            );
          } else {
            const id = `${itemInput.productId}-${Date.now()}`;
            nextItems = [...state.items, { ...itemInput, id }];
          }

          const totals = computeTotals(nextItems);

          return {
            items: nextItems,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const nextItems = state.items.filter((i) => i.id !== id);
          const totals = computeTotals(nextItems);

          return {
            items: nextItems,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
          };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const nextItems = state.items
            .map((i) => (i.id === id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0);
          const totals = computeTotals(nextItems);

          return {
            items: nextItems,
            subtotal: totals.subtotal,
            discount: totals.discount,
            total: totals.total,
          };
        });
      },

      clear: () => {
        set({
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        });
      },
    }),
    {
      name: "bhendi-bazaar-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);