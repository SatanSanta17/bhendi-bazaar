// src/server/services/cartService.ts

import { cartRepository } from "@/server/repositories/cartRepository";
import type { CartItem } from "@/server/domain/cart";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Cart service - Business logic layer
 * Only uses server-side types and dependencies
 */
export class CartService {
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
   * Uses Prisma transaction for atomicity
   */
  async syncCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
    try {
      // Use Prisma transaction for atomicity
      const mergedItems = await prisma.$transaction(async (tx) => {
        // Fetch remote cart within transaction
        const remoteCart = await tx.cart.findUnique({
          where: { userId },
        });
        const remoteItems = remoteCart?.items
          ? Array.isArray(remoteCart.items)
            ? (remoteCart.items as unknown as CartItem[])
            : []
          : [];

        // Merge carts
        let merged = this.mergeCartItems(localItems, remoteItems);

        // Fetch all products in one query (within transaction)
        const slugs = merged.map((i) => i.productSlug);
        const products = await tx.product.findMany({
          where: { slug: { in: slugs } },
        });
        const productMap = new Map(products.map((p) => [p.slug, p]));

        // Filter deleted products and refresh prices
        merged = merged
          .filter((i) => productMap.has(i.productSlug))
          .map((i) => {
            const product = productMap.get(i.productSlug)!;
            return {
              ...i,
              price: product.price,
              salePrice: product.salePrice ?? undefined,
              thumbnail: product.thumbnail,
            };
          });

        // Save merged cart within transaction
        await tx.cart.upsert({
          where: { userId },
          update: {
            items: merged as unknown as Prisma.InputJsonValue,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
          create: {
            userId,
            items: merged as unknown as Prisma.InputJsonValue,
            version: 1,
          },
        });

        return merged;
      });

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
      if (!item.productName) {
        throw new Error("Each item must have a productName");
      }
      if (!item.productSlug) {
        throw new Error("Each item must have a productSlug");
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
  private mergeCartItems(
    localItems: CartItem[],
    remoteItems: CartItem[]
  ): CartItem[] {
    console.log(
      "🔄 [MERGE DEBUG] Local items:",
      localItems.length,
      localItems.map((i) => ({ id: i.productId, qty: i.quantity }))
    );
    console.log(
      "🔄 [MERGE DEBUG] Remote items:",
      remoteItems.length,
      remoteItems.map((i) => ({ id: i.productId, qty: i.quantity }))
    );

    const mergedMap = new Map<string, Omit<CartItem, "id">>();

    // Add remote items (without ID)
    for (const item of remoteItems) {
      const key = this.getItemKey(item);
      console.log("🔄 [MERGE DEBUG] Adding remote item with key:", key);
      mergedMap.set(key, item);
    }

    console.log("🔄 [MERGE DEBUG] Map after remote items:", mergedMap.size);

    // Merge local items
    for (const item of localItems) {
      const key = this.getItemKey(item);
      const existing = mergedMap.get(key);

      if (existing) {
        console.log(
          "🔄 [MERGE DEBUG] Updating existing item:",
          key,
          "qty:",
          existing.quantity,
          "→",
          item.quantity
        );
        mergedMap.set(key, {
          ...existing,
          quantity: item.quantity,
        });
      } else {
        console.log("🔄 [MERGE DEBUG] Adding new local item:", key);
        mergedMap.set(key, item);
      }
    }

    console.log("🔄 [MERGE DEBUG] Final merged map size:", mergedMap.size);

    // Generate fresh IDs for all merged items
    const result = Array.from(mergedMap.values()).map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    console.log(
      "🔄 [MERGE DEBUG] Final result:",
      result.length,
      result.map((i) => ({ id: i.productId, qty: i.quantity }))
    );

    return result;
  }

  /**
   * Generate unique key for cart item
   */
  private getItemKey(item: CartItem): string {
    return `${item.productId}-${item.size || "default"}-${
      item.color || "default"
    }`;
  }
}

export const cartService = new CartService();
