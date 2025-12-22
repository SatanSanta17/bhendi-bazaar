// src/server/repositories/cartRepository.ts

import { prisma } from "@/lib/prisma";
import type { CartItem, ServerCart } from "@/server/domain/cart";

/**
 * Cart repository - Data access layer
 * Only uses server-side types and dependencies
 */
export class CartRepository {
  /**
   * Find cart by user ID
   */
  async findByUserId(userId: string): Promise<ServerCart | null> {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) return null;

      return {
        id: cart.id,
        userId: cart.userId,
        items: cart.items as unknown as CartItem[],
        updatedAt: cart.updatedAt,
      };
    } catch (error) {
      console.error("[CartRepository] findByUserId failed:", error);
      throw new Error("Failed to fetch cart from database");
    }
  }

  /**
   * Create or update cart
   */
  async upsert(userId: string, items: CartItem[]): Promise<ServerCart> {
    try {
      const cart = await prisma.cart.upsert({
        where: { userId },
        update: {
          items: items as any,
          updatedAt: new Date(),
        },
        create: {
          userId,
          items: items as any,
        },
      });

      return {
        id: cart.id,
        userId: cart.userId,
        items: cart.items as unknown as CartItem[],
        updatedAt: cart.updatedAt,
      };
    } catch (error) {
      console.error("[CartRepository] upsert failed:", error);
      throw new Error("Failed to save cart to database");
    }
  }

  /**
   * Clear cart items
   */
  async clear(userId: string): Promise<void> {
    try {
      await prisma.cart.update({
        where: { userId },
        data: {
          items: [],
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("[CartRepository] clear failed:", error);
      throw new Error("Failed to clear cart");
    }
  }

  /**
   * Delete cart completely
   */
  async delete(userId: string): Promise<void> {
    try {
      await prisma.cart.delete({
        where: { userId },
      });
    } catch (error) {
      console.error("[CartRepository] delete failed:", error);
      // Ignore if cart doesn't exist
    }
  }
}

export const cartRepository = new CartRepository();