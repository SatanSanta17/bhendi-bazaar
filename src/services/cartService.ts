// src/services/cartService.ts

import type { CartItem } from "@/domain/cart";

/**
 * Client-side cart service
 * Only uses client-side types
 * Communicates with server via HTTP (no direct imports)
 */
export class CartService {
  private baseUrl = "/api/cart";

  async getCart(): Promise<CartItem[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("[CartService] getCart failed:", error);
      return [];
    }
  }

  async syncCart(localItems: CartItem[]): Promise<CartItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ items: localItems }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync cart: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("[CartService] syncCart failed:", error);
      return localItems;
    }
  }

  async updateCart(items: CartItem[]): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update cart: ${response.statusText}`);
      }
    } catch (error) {
      console.error("[CartService] updateCart failed:", error);
    }
  }

  async clearCart(): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to clear cart: ${response.statusText}`);
      }
    } catch (error) {
      console.error("[CartService] clearCart failed:", error);
    }
  }
}

export const cartService = new CartService();