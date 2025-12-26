/**
 * Race Condition Tests
 *
 * Tests for concurrent operations and race condition handling in critical flows
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';
import { createMockCartItem } from '../utils/mock-factories';

describe('Race Condition Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cart store
    useCartStore.setState({
      items: [],
      buyNowItem: null,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Concurrent Cart Updates', () => {
    it('should handle multiple addItem calls correctly', () => {
      const store = useCartStore.getState();
      const item1 = createMockCartItem({ productId: 'prod-1', quantity: 1 });
      const item2 = createMockCartItem({ productId: 'prod-2', quantity: 1 });
      const item3 = createMockCartItem({ productId: 'prod-3', quantity: 1 });

      act(() => {
        store.addItem(item1);
        store.addItem(item2);
        store.addItem(item3);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(3);
    });

    it('should handle rapid addItem and removeItem operations', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ productId: 'prod-1' });

      act(() => {
        store.addItem(item);
      });

      const itemId = useCartStore.getState().items[0].id;

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-2' }));
        store.removeItem(itemId);
        store.addItem(createMockCartItem({ productId: 'prod-3' }));
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.some((i) => i.productId === 'prod-1')).toBe(false);
    });

    it('should handle concurrent quantity updates', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ productId: 'prod-1', quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const itemId = useCartStore.getState().items[0].id;

      act(() => {
        store.updateQuantity(itemId, 5);
        store.updateQuantity(itemId, 3);
        store.updateQuantity(itemId, 7);
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(7); // Last update wins
    });
  });

  describe('Stock Check Race Conditions', () => {
    it('should handle stock check while adding items', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true, items: [] }),
      });

      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      // Simulate stock check and add happening concurrently
      await act(async () => {
        const checkPromise = store.checkStockAvailability();
        store.addItem(createMockCartItem({ productId: 'prod-2' }));
        await checkPromise;
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });

    it('should handle multiple stock checks', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ available: true, items: [] }),
      });

      const store = useCartStore.getState();
      act(() => {
        store.addItem(createMockCartItem({ quantity: 1 }));
        store.addItem(createMockCartItem({ productId: 'prod-2', quantity: 2 }));
      });

      await act(async () => {
        const [result1, result2, result3] = await Promise.all([
          store.checkStockAvailability(),
          store.checkStockAvailability(),
          store.checkStockAvailability(),
        ]);

        expect(result1.available).toBe(true);
        expect(result2.available).toBe(true);
        expect(result3.available).toBe(true);
      });
    });
  });

  describe('Buy Now vs Cart Race Conditions', () => {
    it('should handle buyNow set while cart is being updated', () => {
      const store = useCartStore.getState();
      const cartItem = createMockCartItem({ productId: 'cart-1' });
      const buyNowItem = createMockCartItem({ productId: 'buy-1' });

      act(() => {
        store.addItem(cartItem);
        store.setBuyNowItem(buyNowItem);
        store.addItem(createMockCartItem({ productId: 'cart-2' }));
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.buyNowItem).toBeDefined();
      expect(state.buyNowItem?.productId).toBe('buy-1');
    });

    it('should handle clearing buyNow while adding to cart', () => {
      const store = useCartStore.getState();

      act(() => {
        store.setBuyNowItem(createMockCartItem({ productId: 'buy-1' }));
        store.addItem(createMockCartItem({ productId: 'cart-1' }));
        store.clearBuyNow();
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.buyNowItem).toBeNull();
    });
  });

  describe('Clear Cart Race Conditions', () => {
    it('should handle clear during multiple add operations', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.addItem(createMockCartItem({ productId: 'prod-2' }));
        store.clear();
        store.addItem(createMockCartItem({ productId: 'prod-3' }));
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('prod-3');
    });

    it('should handle clear and buyNow operations', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'cart-1' }));
        store.setBuyNowItem(createMockCartItem({ productId: 'buy-1' }));
        store.clear(); // Should clear both cart and buyNow
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      // Note: clear() doesn't clear buyNowItem by default, only cart items
      // If you need to clear buyNow, call clearBuyNow() explicitly
    });
  });

  describe('Totals Computation Race Conditions', () => {
    it('should maintain consistent totals during rapid updates', () => {
      const store = useCartStore.getState();
      const item1 = createMockCartItem({
        productId: 'prod-1',
        price: 100,
        salePrice: 80,
        quantity: 1,
      });
      const item2 = createMockCartItem({
        productId: 'prod-2',
        price: 200,
        salePrice: 150,
        quantity: 2,
      });

      act(() => {
        store.addItem(item1);
        store.addItem(item2);
      });

      let state = useCartStore.getState();
      const expectedSubtotal = 100 + 200 * 2; // 500
      const expectedDiscount = (100 - 80) + (200 - 150) * 2; // 20 + 100 = 120
      const expectedTotal = expectedSubtotal - expectedDiscount; // 380

      expect(state.subtotal).toBe(expectedSubtotal);
      expect(state.discount).toBe(expectedDiscount);
      expect(state.total).toBe(expectedTotal);

      // Now update quantity
      const itemId = state.items.find((i) => i.productId === 'prod-1')?.id;
      act(() => {
        if (itemId) store.updateQuantity(itemId, 3);
      });

      state = useCartStore.getState();
      const newSubtotal = 100 * 3 + 200 * 2; // 700
      const newDiscount = (100 - 80) * 3 + (200 - 150) * 2; // 60 + 100 = 160
      const newTotal = newSubtotal - newDiscount; // 540

      expect(state.subtotal).toBe(newSubtotal);
      expect(state.discount).toBe(newDiscount);
      expect(state.total).toBe(newTotal);
    });
  });

  describe('Sync State Race Conditions', () => {
    it('should handle sync flags during cart operations', () => {
      const store = useCartStore.getState();

      act(() => {
        store.setSyncing(true);
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.setSyncing(false);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.isSyncing).toBe(false);
    });

    it('should handle sync errors during cart operations', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.setSyncError('Sync failed');
        store.addItem(createMockCartItem({ productId: 'prod-2' }));
        store.setSyncError(null);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.lastSyncError).toBeNull();
    });
  });
});

