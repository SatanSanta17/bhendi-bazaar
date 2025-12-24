import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { CartItem, CartState } from "@/domain/cart";

type CartStoreState = CartState & {
  subtotal: number;
  discount: number;
  total: number;
  buyNowItem: CartItem | null;
  isSyncing: boolean;
  lastSyncError: string | null;

  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateQuantityWithLimit: (id: string, quantity: number, maxStock: number) => boolean;
  clear: () => void;
  setBuyNowItem: (item: Omit<CartItem, "id"> | null) => void;
  clearBuyNow: () => void;
  setItems: (items: CartItem[]) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  checkStockAvailability: () => Promise<{
    available: boolean;
    issues: Array<{ productId: string; message: string }>;
  }>;
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
    (set, get) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      buyNowItem: null,
      isSyncing: false,
      lastSyncError: null,

      addItem: async (itemInput) => {
        // Add item to cart without stock validation
        // Stock will be validated at checkout via checkStockAvailability()
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
            ...totals,
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const nextItems = state.items.filter((i) => i.id !== id);
          const totals = computeTotals(nextItems);

          return {
            items: nextItems,
            ...totals,
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
            ...totals,
          };
        });
      },

      updateQuantityWithLimit: (id, quantity, maxStock) => {
        let success = false;
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;

          // Validate against max stock
          if (quantity > maxStock) {
            success = false;
            return state; // Don't update
          }

          success = true;
          const nextItems = state.items
            .map((i) => (i.id === id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0);
          const totals = computeTotals(nextItems);

          return {
            items: nextItems,
            ...totals,
          };
        });
        return success;
      },

      clear: () => {
        set({
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        });
      },

      setBuyNowItem: (itemInput) => {
        if (!itemInput) {
          set({ buyNowItem: null });
          return;
        }
        const id = `buynow-${itemInput.productId}-${Date.now()}`;
        set({ buyNowItem: { ...itemInput, id } });
      },

      clearBuyNow: () => {
        set({ buyNowItem: null });
      },

      setItems: (items) => {
        const totals = computeTotals(items);
        set({ items, ...totals });
      },

      setSyncing: (syncing) => {
        set({ isSyncing: syncing });
      },

      setSyncError: (error) => {
        set({ lastSyncError: error });
      },

      checkStockAvailability: async () => {
        const state = get();
        const items = state.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        if (items.length === 0) {
          return { available: true, issues: [] };
        }

        try {
          const response = await fetch("/api/products/check-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });

          if (!response.ok) {
            throw new Error("Stock check failed");
          }

          const data = await response.json();

          if (!data.available) {
            const issues = data.items
              .filter((item: any) => !item.available)
              .map((item: any) => ({
                productId: item.productId,
                message: `Only ${item.stock} available for ${item.name} (you requested ${item.requested})`,
              }));

            return { available: false, issues };
          }

          return { available: true, issues: [] };
        } catch (error) {
          console.error("Stock check failed:", error);
          return {
            available: false,
            issues: [
              { productId: "", message: "Failed to verify stock availability" },
            ],
          };
        }
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