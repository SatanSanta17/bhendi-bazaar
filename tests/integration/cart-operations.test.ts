/**
 * Cart Operations Integration Tests
 *
 * Tests cart persistence, syncing, and operations across different user states
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';
import { cartService } from '@/services/cartService';
import { createMockCartItem } from '../utils/mock-factories';

vi.mock('@/services/cartService');

describe('Cart Operations Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cart store
    useCartStore.setState({
      items: [],
      buyNowItem: null,
      totals: { subtotal: 0, discount: 0, total: 0 },
      isSyncing: false,
      syncError: null,
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Add to Cart Flow', () => {
    it('should add item and compute totals', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 2 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.subtotal).toBeGreaterThan(0);
    });

    it('should merge quantities for existing items', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ productId: 'prod-1', quantity: 1 });

      act(() => {
        store.addItem(item);
        store.addItem({ ...item, quantity: 2 });
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
    });

    it('should handle items with different variants separately', () => {
      const store = useCartStore.getState();
      const item1 = createMockCartItem({
        productId: 'prod-1',
        size: 'M',
        quantity: 1,
      });
      const item2 = createMockCartItem({
        productId: 'prod-1',
        size: 'L',
        quantity: 1,
      });

      act(() => {
        store.addItem(item1);
        store.addItem(item2);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });
  });

  describe('Update Quantity Flow', () => {
    it('should update item quantity', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const itemKey = useCartStore.getState().items[0].id;

      act(() => {
        store.updateQuantity(itemKey, 3);
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
    });

    it('should remove item when quantity becomes zero', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 2 });

      act(() => {
        store.addItem(item);
      });

      const itemKey = useCartStore.getState().items[0].id;

      act(() => {
        store.updateQuantity(itemKey, 0);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should respect stock limits', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const itemKey = useCartStore.getState().items[0].id;

      act(() => {
        store.updateQuantityWithLimit(itemKey, 1000, 10);
      });

      const state = useCartStore.getState();
      // updateQuantityWithLimit returns false and doesn't update when quantity > maxStock
      expect(state.items[0].quantity).toBe(1); // Should remain unchanged
    });
  });

  describe('Remove Item Flow', () => {
    it('should remove item from cart', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem();

      act(() => {
        store.addItem(item);
      });

      const itemKey = useCartStore.getState().items[0].id;

      act(() => {
        store.removeItem(itemKey);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.totals.total).toBe(0);
    });
  });

  describe('Buy Now Flow', () => {
    it('should set buyNowItem temporarily', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem();

      act(() => {
        store.setBuyNowItem(item);
      });

      const state = useCartStore.getState();
      expect(state.buyNowItem).toBeDefined();
      expect(state.buyNowItem?.productId).toBe(item.productId);
      expect(state.buyNowItem?.quantity).toBe(item.quantity);
      // ID is different because store generates it
      expect(state.buyNowItem?.id).toContain('buynow');
    });

    it('should clear buyNowItem', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem();

      act(() => {
        store.setBuyNowItem(item);
        store.clearBuyNow();
      });

      const state = useCartStore.getState();
      expect(state.buyNowItem).toBeNull();
    });

    it('should keep cart items when buyNow is set', () => {
      const store = useCartStore.getState();
      const cartItem = createMockCartItem({ productId: 'cart-1' });
      const buyNowItem = createMockCartItem({ productId: 'buy-1' });

      act(() => {
        store.addItem(cartItem);
        store.setBuyNowItem(buyNowItem);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.buyNowItem).toBeDefined();
      expect(state.buyNowItem?.productId).toBe('buy-1');
    });
  });

  describe('Clear Cart Flow', () => {
    it('should clear all items and totals', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.addItem(createMockCartItem({ productId: 'prod-2' }));
        store.clear();
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.totals.total).toBe(0);
      expect(state.buyNowItem).toBeNull();
    });
  });

  describe('Stock Check Integration', () => {
    it('should check stock availability for all items', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true, items: [] }),
      });

      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 2 });

      act(() => {
        store.addItem(item);
      });

      await act(async () => {
        const result = await store.checkStockAvailability();
        expect(result.available).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });

    it('should handle stock unavailable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          available: false,
          items: [
            {
              productId: 'prod-1',
              name: 'Test Product',
              available: false,
              stock: 3,
              requested: 5,
            },
          ],
        }),
      });

      const store = useCartStore.getState();
      const item = createMockCartItem({ productId: 'prod-1', quantity: 5 });

      act(() => {
        store.addItem(item);
      });

      await act(async () => {
        const result = await store.checkStockAvailability();
        expect(result.available).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].productId).toBe('prod-1');
      });
    });

    it('should handle stock check error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const store = useCartStore.getState();
      const item = createMockCartItem();

      act(() => {
        store.addItem(item);
      });

      await act(async () => {
        const result = await store.checkStockAvailability();
        expect(result.available).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0].message).toContain('Failed to verify');
      });
    });
  });

  describe('Sync State Management', () => {
    it('should set syncing state', () => {
      const store = useCartStore.getState();

      act(() => {
        store.setSyncing(true);
      });

      expect(useCartStore.getState().isSyncing).toBe(true);

      act(() => {
        store.setSyncing(false);
      });

      expect(useCartStore.getState().isSyncing).toBe(false);
    });

    it('should set sync error', () => {
      const store = useCartStore.getState();

      act(() => {
        store.setSyncError('Failed to sync cart');
      });

      expect(useCartStore.getState().lastSyncError).toBe('Failed to sync cart');

      act(() => {
        store.setSyncError(null);
      });

      expect(useCartStore.getState().lastSyncError).toBeNull();
    });
  });

  describe('Set Items (Bulk Operation)', () => {
    it('should replace all items', () => {
      const store = useCartStore.getState();
      const items = [
        createMockCartItem({ productId: 'prod-1' }),
        createMockCartItem({ productId: 'prod-2' }),
      ];

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-old' }));
        store.setItems(items);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.some((item) => item.productId === 'prod-old')).toBe(
        false
      );
    });

    it('should recompute totals after bulk set', () => {
      const store = useCartStore.getState();
      const items = [
        createMockCartItem({
          id: 'item-1',
          price: 100,
          salePrice: 90,
          quantity: 2,
        }),
        createMockCartItem({
          id: 'item-2',
          price: 200,
          salePrice: 180,
          quantity: 1,
        }),
      ];

      act(() => {
        store.setItems(items);
      });

      const state = useCartStore.getState();
      // Total is computed from price * quantity (not salePrice)
      // Then discount is subtracted
      const expectedSubtotal = 100 * 2 + 200 * 1; // 400
      const expectedDiscount = (100 - 90) * 2 + (200 - 180) * 1; // 20 + 20 = 40
      const expectedTotal = expectedSubtotal - expectedDiscount; // 360

      expect(state.subtotal).toBe(expectedSubtotal);
      expect(state.discount).toBe(expectedDiscount);
      expect(state.total).toBe(expectedTotal);
    });
  });
});

