// src/domain/cart.ts

import type { ProductId } from "./product";

export interface CartItem {
  id: string;
  productId: ProductId;
  name: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
}

// NEW: Service interface for client-side operations
export interface CartService {
  getCart(): Promise<CartItem[]>;
  syncCart(localItems: CartItem[]): Promise<CartItem[]>;
  updateCart(items: CartItem[]): Promise<void>;
  clearCart(): Promise<void>;
}
