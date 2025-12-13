import { create } from "zustand";

import type { CartItem, CartState } from "@/domain/cart";

const STORAGE_KEY = "bhendi-bazaar-cart";

type CartStoreState = CartState & {
  subtotal: number;
  discount: number;
  total: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  rehydrateFromStorage: () => void;
};

function readFromStorage(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw) as CartState;
  } catch {
    return { items: [] };
  }
}

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

function loadInitialState(): CartState {
  if (typeof window === "undefined") {
    return { items: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw) as CartState;
  } catch {
    return { items: [] };
  }
}

function persist(state: CartState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useCartStore = create<CartStoreState>((set) => {
  const initial = loadInitialState();
  const initialTotals = computeTotals(initial.items);

  return {
    items: initial.items,
    subtotal: initialTotals.subtotal,
    discount: initialTotals.discount,
    total: initialTotals.total,

    rehydrateFromStorage: () => {
      const stored = readFromStorage();
      const totals = computeTotals(stored.items);
      set({
        items: stored.items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
      });
    },

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

        const nextCartState: CartState = { items: nextItems };
        persist(nextCartState);

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
        const nextCartState: CartState = { items: nextItems };
        persist(nextCartState);
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
        const nextCartState: CartState = { items: nextItems };
        persist(nextCartState);
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
      set(() => {
        const nextCartState: CartState = { items: [] };
        persist(nextCartState);
        return {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        };
      });
    },
  };
});


