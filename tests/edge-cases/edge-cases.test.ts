/**
 * Edge Case Tests
 *
 * Tests for boundary conditions, unusual inputs, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';
import { createMockCartItem } from '../utils/mock-factories';

describe('Edge Case Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
      items: [],
      buyNowItem: null,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
    localStorage.clear();
  });

  describe('Numeric Boundaries', () => {
    it('should handle zero price', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 0, salePrice: 0, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(0);
      expect(state.total).toBe(0);
    });

    it('should handle very large prices', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 999999, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(999999);
    });

    it('should handle decimal prices', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 99.99, salePrice: 79.99, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBeCloseTo(99.99, 2);
      expect(state.discount).toBeCloseTo(20, 2);
    });

    it('should handle very small decimal prices', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 0.01, salePrice: 0.01, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(0.01);
    });

    it('should handle large quantities', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 10, quantity: 1000 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(10000);
    });

    it('should handle quantity of 1 (minimum valid)', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(1);
    });
  });

  describe('String Boundaries', () => {
    it('should handle empty product name', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ name: '' });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].name).toBe('');
    });

    it('should handle very long product name', () => {
      const longName = 'A'.repeat(1000);
      const store = useCartStore.getState();
      const item = createMockCartItem({ name: longName });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].name).toHaveLength(1000);
    });

    it('should handle special characters in product name', () => {
      const specialName = "Test's Product & Co. (New)";
      const store = useCartStore.getState();
      const item = createMockCartItem({ name: specialName });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].name).toBe(specialName);
    });

    it('should handle unicode characters', () => {
      const unicodeName = 'Café ☕ 日本語';
      const store = useCartStore.getState();
      const item = createMockCartItem({ name: unicodeName });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].name).toBe(unicodeName);
    });

    it('should handle product ID edge cases', () => {
      const store = useCartStore.getState();
      const ids = ['1', 'abc-123', 'PROD_2024', ''];

      ids.forEach((id) => {
        act(() => {
          store.addItem(createMockCartItem({ productId: id }));
        });
      });

      const state = useCartStore.getState();
      expect(state.items.length).toBeGreaterThan(0);
    });
  });

  describe('Optional Fields', () => {
    it('should handle missing salePrice', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 100, salePrice: undefined, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(100);
      expect(state.discount).toBe(0);
      expect(state.total).toBe(100);
    });

    it('should handle missing size', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ size: undefined });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].size).toBeUndefined();
    });

    it('should handle missing color', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ color: undefined });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].color).toBeUndefined();
    });

    it('should handle empty thumbnail URL', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ thumbnail: '' });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.items[0].thumbnail).toBe('');
    });
  });

  describe('State Transitions', () => {
    it('should handle empty cart operations', () => {
      const store = useCartStore.getState();

      // Operations on empty cart
      act(() => {
        store.clear();
        store.clearBuyNow();
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.buyNowItem).toBeNull();
    });

    it('should handle removing non-existent item', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.removeItem('non-existent-id');
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
    });

    it('should handle updating quantity of non-existent item', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem({ productId: 'prod-1' }));
        store.updateQuantity('non-existent-id', 5);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1); // Unchanged
    });

    it('should handle setting null buyNowItem', () => {
      const store = useCartStore.getState();

      act(() => {
        store.setBuyNowItem(null);
      });

      const state = useCartStore.getState();
      expect(state.buyNowItem).toBeNull();
    });
  });

  describe('Array Operations', () => {
    it('should handle setting empty items array', () => {
      const store = useCartStore.getState();

      act(() => {
        store.addItem(createMockCartItem());
        store.setItems([]);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.total).toBe(0);
    });

    it('should handle setting large items array', () => {
      const store = useCartStore.getState();
      const items = Array.from({ length: 100 }, (_, i) =>
        createMockCartItem({ id: `item-${i}`, productId: `prod-${i}` })
      );

      act(() => {
        store.setItems(items);
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(100);
    });

    it('should handle duplicate items in setItems', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ id: 'item-1', productId: 'prod-1' });
      const items = [item, item, item]; // Duplicates

      act(() => {
        store.setItems(items);
      });

      const state = useCartStore.getState();
      // Should accept duplicates if they have same id
      expect(state.items.length).toBeGreaterThan(0);
    });
  });

  describe('Calculation Edge Cases', () => {
    it('should handle salePrice higher than price (invalid but possible)', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 100, salePrice: 150, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      // Discount calculation might be negative
      expect(state.discount).toBeLessThan(0);
      expect(state.total).toBeGreaterThan(state.subtotal);
    });

    it('should handle price equals salePrice (no discount)', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ price: 100, salePrice: 100, quantity: 1 });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      expect(state.discount).toBe(0);
      expect(state.total).toBe(state.subtotal);
    });

    it('should handle rounding precision', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({
        price: 33.33,
        salePrice: 22.22,
        quantity: 3,
      });

      act(() => {
        store.addItem(item);
      });

      const state = useCartStore.getState();
      // Check for floating point precision
      expect(state.subtotal).toBeCloseTo(99.99, 2);
      expect(state.discount).toBeCloseTo(33.33, 2);
    });
  });

  describe('Timing and Async Edge Cases', () => {
    it('should handle rapid state updates', () => {
      const store = useCartStore.getState();

      act(() => {
        for (let i = 0; i < 10; i++) {
          store.addItem(createMockCartItem({ productId: `prod-${i}` }));
        }
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(10);
    });

    it('should handle stock check with empty cart', async () => {
      const store = useCartStore.getState();

      await act(async () => {
        const result = await store.checkStockAvailability();
        expect(result.available).toBe(true);
        expect(result.issues).toHaveLength(0);
      });
    });
  });
});

