// src/server/services/cartService.ts

import { cartRepository } from "@/server/repositories/cartRepository";
import type { CartItem } from "@/server/domain/cart";

/**
 * Cart service - Business logic layer
 * Only uses server-side types and dependencies
 */
export class CartService {
  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      const cart = await cartRepository.findByUserId(userId);
      return cart?.items || [];
    } catch (error) {
      console.error("[CartService] getCart failed:", error);
      return [];
    }
  }

  /**
   * Update user's cart
   */
  async updateCart(userId: string, items: CartItem[]): Promise<void> {
    // Validate items
    this.validateCartItems(items);

    // Save to database
    await cartRepository.upsert(userId, items);
  }

  /**
   * Sync local cart with server cart on login
   */
  async syncCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
    try {
      // Fetch remote cart
      const remoteCart = await cartRepository.findByUserId(userId);
      const remoteItems = remoteCart?.items || [];

      // Merge carts
      const mergedItems = this.mergeCartItems(localItems, remoteItems);

      // Save merged cart
      await cartRepository.upsert(userId, mergedItems);

      return mergedItems;
    } catch (error) {
      console.error("[CartService] syncCart failed:", error);
      return localItems;
    }
  }

  /**
   * Clear user's cart
   */
  async clearCart(userId: string): Promise<void> {
    await cartRepository.clear(userId);
  }

  /**
   * Validate cart items
   */
  private validateCartItems(items: CartItem[]): void {
    if (!Array.isArray(items)) {
      throw new Error("Cart items must be an array");
    }

    for (const item of items) {
      if (!item.productId) {
        throw new Error("Each item must have a productId");
      }
      if (!item.name) {
        throw new Error("Each item must have a name");
      }
      if (item.quantity <= 0) {
        throw new Error("Item quantity must be positive");
      }
      if (item.price < 0) {
        throw new Error("Item price cannot be negative");
      }
    }
  }

  /**
   * Merge cart items
   */
  private mergeCartItems(localItems: CartItem[], remoteItems: CartItem[]): CartItem[] {
    const mergedMap = new Map<string, CartItem>();

    // Add remote items
    for (const item of remoteItems) {
      const key = this.getItemKey(item);
      mergedMap.set(key, { ...item });
    }

    // Merge local items
    for (const item of localItems) {
      const key = this.getItemKey(item);
      const existing = mergedMap.get(key);

      if (existing) {
        mergedMap.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        mergedMap.set(key, { ...item });
      }
    }

    return Array.from(mergedMap.values());
  }

  /**
   * Generate unique key for cart item
   */
  private getItemKey(item: CartItem): string {
    return `${item.productId}-${item.size || "default"}-${item.color || "default"}`;
  }
}

export const cartService = new CartService();