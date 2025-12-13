import { create } from "zustand";

import type { CartItem, CartState, CartTotals } from "@/domain/cart";

const STORAGE_KEY = "bhendi-bazaar-cart";

type CartStoreState = CartState & {
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totals: () => CartTotals;
};

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

export const useCartStore = create<CartStoreState>((set, get) => ({
  ...loadInitialState(),
  addItem: (itemInput) => {
    const state = get();
    const existing = state.items.find(
      (i) =>
        i.productId === itemInput.productId &&
        i.size === itemInput.size &&
        i.color === itemInput.color,
    );

    let nextItems: CartItem[];

    if (existing) {
      nextItems = state.items.map((i) =>
        i === existing ? { ...i, quantity: i.quantity + itemInput.quantity } : i,
      );
    } else {
      const id = `${itemInput.productId}-${Date.now()}`;
      nextItems = [...state.items, { ...itemInput, id }];
    }

    const nextState: CartState = { items: nextItems };
    persist(nextState);
    set(nextState);
  },
  removeItem: (id) => {
    const state = get();
    const nextState: CartState = {
      items: state.items.filter((i) => i.id !== id),
    };
    persist(nextState);
    set(nextState);
  },
  updateQuantity: (id, quantity) => {
    const state = get();
    const nextItems = state.items
      .map((i) => (i.id === id ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    const nextState: CartState = { items: nextItems };
    persist(nextState);
    set(nextState);
  },
  clear: () => {
    const nextState: CartState = { items: [] };
    persist(nextState);
    set(nextState);
  },
  totals: () => {
    const { items } = get();
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discounted = items.reduce(
      (sum, item) =>
        sum +
        (item.salePrice ? (item.price - item.salePrice) * item.quantity : 0),
      0,
    );
    const total = subtotal - discounted;
    return {
      subtotal,
      discount: discounted,
      total,
    };
  },
}));


