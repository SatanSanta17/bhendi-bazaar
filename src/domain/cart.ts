// src/domain/cart.ts

import type { ShippingMode } from "@/domain/shipping";

export interface Cart {
  items: CartItem[];
  totals: CartTotals;
  updatedAt: Date;
}

export interface Shipping {
  providerId: string;
  courierName: string;
  shippingCost: number;
  estimatedDays: number;
  mode: ShippingMode;
  packageWeight: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
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
  shipping: number;
  total: number;
}

// NEW: Service interface for client-side operations
export interface CartService {
  syncCart(localItems: CartItem[]): Promise<CartItem[]>;
  updateCart(items: CartItem[]): Promise<void>;
  clearCart(): Promise<void>;
}
