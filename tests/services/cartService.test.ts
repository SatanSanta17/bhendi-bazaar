/**
 * CartService Tests
 *
 * Tests for server-side cart service business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartService, CartService } from "../../server/services/cartService";
import { cartRepository } from "../../server/repositories/cartRepository";
import type { CartItem, ServerCart } from "../../server/domain/cart";

// Mock the cart repository
vi.mock('@/server/repositories/cartRepository', () => ({
  cartRepository: {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('CartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock cart item
  const createMockCartItem = (overrides?: Partial<CartItem>): CartItem => ({
    id: 'item-1',
    productId: 'product-1',
    name: 'Test Product',
    thumbnail: 'test.jpg',
    price: 100,
    salePrice: 80,
    quantity: 1,
    size: 'M',
    color: 'Red',
    ...overrides,
  });

  // Helper function to create mock server cart
  const createMockServerCart = (overrides?: Partial<ServerCart>): ServerCart => ({
    id: 'cart-1',
    userId: 'user-1',
    items: [createMockCartItem()],
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  describe('getCart', () => {
    it('should return cart items for user', async () => {
      const mockCart = createMockServerCart({
        items: [
          createMockCartItem({ id: 'item-1' }),
          createMockCartItem({ id: 'item-2', productId: 'product-2' }),
        ],
      });
      vi.mocked(cartRepository.findByUserId).mockResolvedValue(mockCart);

      const result = await cartService.getCart('user-1');

      expect(result).toEqual(mockCart.items);
      expect(result).toHaveLength(2);
      expect(cartRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when cart not found', async () => {
      vi.mocked(cartRepository.findByUserId).mockResolvedValue(null);

      const result = await cartService.getCart('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when cart has no items', async () => {
      const mockCart = createMockServerCart({ items: [] });
      vi.mocked(cartRepository.findByUserId).mockResolvedValue(mockCart);

      const result = await cartService.getCart('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      vi.mocked(cartRepository.findByUserId).mockRejectedValue(
        new Error('Database error')
      );

      const result = await cartService.getCart('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateCart', () => {
    it('should update cart with valid items', async () => {
      const items = [createMockCartItem()];
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      await cartService.updateCart('user-1', items);

      expect(cartRepository.upsert).toHaveBeenCalledWith('user-1', items);
      expect(cartRepository.upsert).toHaveBeenCalledTimes(1);
    });

    it('should update cart with multiple items', async () => {
      const items = [
        createMockCartItem({ id: 'item-1' }),
        createMockCartItem({ id: 'item-2', productId: 'product-2' }),
        createMockCartItem({ id: 'item-3', productId: 'product-3' }),
      ];
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      await cartService.updateCart('user-1', items);

      expect(cartRepository.upsert).toHaveBeenCalledWith('user-1', items);
    });

    it('should update cart with empty items array', async () => {
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      await cartService.updateCart('user-1', []);

      expect(cartRepository.upsert).toHaveBeenCalledWith('user-1', []);
    });

    it('should throw error for non-array items', async () => {
      await expect(
        cartService.updateCart('user-1', 'not-an-array' as any)
      ).rejects.toThrow('Cart items must be an array');

      expect(cartRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw error for item missing productId', async () => {
      const items = [{ ...createMockCartItem(), productId: '' }];

      await expect(cartService.updateCart('user-1', items)).rejects.toThrow(
        'Each item must have a productId'
      );

      expect(cartRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw error for item missing name', async () => {
      const items = [{ ...createMockCartItem(), name: '' }];

      await expect(cartService.updateCart('user-1', items)).rejects.toThrow(
        'Each item must have a name'
      );
    });

    it('should throw error for item with zero quantity', async () => {
      const items = [{ ...createMockCartItem(), quantity: 0 }];

      await expect(cartService.updateCart('user-1', items)).rejects.toThrow(
        'Item quantity must be positive'
      );
    });

    it('should throw error for item with negative quantity', async () => {
      const items = [{ ...createMockCartItem(), quantity: -5 }];

      await expect(cartService.updateCart('user-1', items)).rejects.toThrow(
        'Item quantity must be positive'
      );
    });

    it('should throw error for item with negative price', async () => {
      const items = [{ ...createMockCartItem(), price: -10 }];

      await expect(cartService.updateCart('user-1', items)).rejects.toThrow(
        'Item price cannot be negative'
      );
    });

    it('should accept item with zero price', async () => {
      const items = [{ ...createMockCartItem(), price: 0 }];
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      await cartService.updateCart('user-1', items);

      expect(cartRepository.upsert).toHaveBeenCalled();
    });
  });

  describe('syncCart', () => {
    it('should merge local and remote carts', async () => {
      const localItems = [
        createMockCartItem({ id: 'local-1', productId: 'product-1', quantity: 2 }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({ id: 'remote-1', productId: 'product-2', quantity: 1 }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toHaveLength(2);
      expect(result.some((item) => item.productId === 'product-1')).toBe(true);
      expect(result.some((item) => item.productId === 'product-2')).toBe(true);
      expect(cartRepository.upsert).toHaveBeenCalledWith('user-1', result);
    });

    it('should combine quantities for duplicate items (same product, size, color)', async () => {
      const localItems = [
        createMockCartItem({
          productId: 'product-1',
          quantity: 2,
          size: 'M',
          color: 'Red',
        }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({
            productId: 'product-1',
            quantity: 3,
            size: 'M',
            color: 'Red',
          }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('product-1');
      expect(result[0].quantity).toBe(5); // 2 + 3
    });

    it('should treat different sizes as separate items', async () => {
      const localItems = [
        createMockCartItem({ productId: 'product-1', size: 'M', quantity: 2 }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({ productId: 'product-1', size: 'L', quantity: 1 }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toHaveLength(2);
      expect(result.find((item) => item.size === 'M')?.quantity).toBe(2);
      expect(result.find((item) => item.size === 'L')?.quantity).toBe(1);
    });

    it('should treat different colors as separate items', async () => {
      const localItems = [
        createMockCartItem({ productId: 'product-1', color: 'Red', quantity: 2 }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({ productId: 'product-1', color: 'Blue', quantity: 1 }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toHaveLength(2);
      expect(result.find((item) => item.color === 'Red')?.quantity).toBe(2);
      expect(result.find((item) => item.color === 'Blue')?.quantity).toBe(1);
    });

    it('should handle empty local cart', async () => {
      const remoteCart = createMockServerCart({
        items: [createMockCartItem()],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', []);

      expect(result).toEqual(remoteCart.items);
    });

    it('should handle empty remote cart', async () => {
      const localItems = [createMockCartItem()];
      vi.mocked(cartRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toEqual(localItems);
    });

    it('should handle both carts empty', async () => {
      vi.mocked(cartRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', []);

      expect(result).toEqual([]);
    });

    it('should return local items on sync error', async () => {
      const localItems = [createMockCartItem()];
      vi.mocked(cartRepository.findByUserId).mockRejectedValue(
        new Error('Database error')
      );

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toEqual(localItems);
    });

    it('should handle items without size or color (use "default")', async () => {
      const localItems = [
        createMockCartItem({ productId: 'product-1', size: undefined, color: undefined, quantity: 2 }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({ productId: 'product-1', size: undefined, color: undefined, quantity: 3 }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(5); // Should merge as same item
    });

    it('should handle complex merge scenario with multiple items', async () => {
      const localItems = [
        createMockCartItem({ productId: 'product-1', size: 'M', quantity: 2 }),
        createMockCartItem({ productId: 'product-2', size: 'L', quantity: 1 }),
        createMockCartItem({ productId: 'product-3', size: 'M', quantity: 3 }),
      ];
      const remoteCart = createMockServerCart({
        items: [
          createMockCartItem({ productId: 'product-1', size: 'M', quantity: 1 }),
          createMockCartItem({ productId: 'product-2', size: 'S', quantity: 2 }),
          createMockCartItem({ productId: 'product-4', size: 'M', quantity: 1 }),
        ],
      });

      vi.mocked(cartRepository.findByUserId).mockResolvedValue(remoteCart);
      vi.mocked(cartRepository.upsert).mockResolvedValue();

      const result = await cartService.syncCart('user-1', localItems);

      // Should have 5 unique items
      expect(result).toHaveLength(5);

      // product-1 M should be merged (2 + 1 = 3)
      const product1M = result.find(
        (item) => item.productId === 'product-1' && item.size === 'M'
      );
      expect(product1M?.quantity).toBe(3);

      // product-2 should have two variants (L and S)
      const product2L = result.find(
        (item) => item.productId === 'product-2' && item.size === 'L'
      );
      const product2S = result.find(
        (item) => item.productId === 'product-2' && item.size === 'S'
      );
      expect(product2L?.quantity).toBe(1);
      expect(product2S?.quantity).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('should clear cart for user', async () => {
      vi.mocked(cartRepository.clear).mockResolvedValue();

      await cartService.clearCart('user-1');

      expect(cartRepository.clear).toHaveBeenCalledWith('user-1');
      expect(cartRepository.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('CartService instance', () => {
    it('should export a singleton instance', () => {
      expect(cartService).toBeInstanceOf(CartService);
    });

    it('should be the same instance across imports', () => {
      const service1 = cartService;
      const service2 = cartService;

      expect(service1).toBe(service2);
    });
  });
});

