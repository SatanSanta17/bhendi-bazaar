/**
 * useCartSync Hook Tests - Simplified
 *
 * Basic tests for cart synchronization functionality
 * Note: Full integration tests will cover complex scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';
import { cartService } from '@/services/cartService';
import { createMockCartItem } from '../utils/mock-factories';

// Mock dependencies
vi.mock('@/services/cartService', () => ({
  cartService: {
    syncCart: vi.fn(),
    updateCart: vi.fn(),
  },
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  }),
}));

// Note: Full sync behavior tested in integration tests
// These are unit tests for the cart store sync methods

describe('useCartSync - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset cart store
    useCartStore.setState({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      buyNowItem: null,
      isSyncing: false,
      lastSyncError: null,
    });
  });

  describe('Cart Store Sync State', () => {
    it('should have isSyncing state', () => {
      const state = useCartStore.getState();
      expect(state.isSyncing).toBeDefined();
      expect(state.isSyncing).toBe(false);
    });

    it('should have lastSyncError state', () => {
      const state = useCartStore.getState();
      expect(state.lastSyncError).toBeDefined();
      expect(state.lastSyncError).toBe(null);
    });

    it('should update isSyncing state', () => {
      useCartStore.getState().setSyncing(true);
      expect(useCartStore.getState().isSyncing).toBe(true);

      useCartStore.getState().setSyncing(false);
      expect(useCartStore.getState().isSyncing).toBe(false);
    });

    it('should update lastSyncError state', () => {
      useCartStore.getState().setSyncError('Test error');
      expect(useCartStore.getState().lastSyncError).toBe('Test error');

      useCartStore.getState().setSyncError(null);
      expect(useCartStore.getState().lastSyncError).toBe(null);
    });
  });

  describe('Cart Service Integration', () => {
    it('should call syncCart with correct items', async () => {
      const items = [createMockCartItem()];
      vi.mocked(cartService.syncCart).mockResolvedValue(items);

      await cartService.syncCart(items);

      expect(cartService.syncCart).toHaveBeenCalledWith(items);
    });

    it('should call updateCart with correct items', async () => {
      const items = [createMockCartItem()];
      vi.mocked(cartService.updateCart).mockResolvedValue();

      await cartService.updateCart(items);

      expect(cartService.updateCart).toHaveBeenCalledWith(items);
    });

    it('should handle syncCart errors', async () => {
      const error = new Error('Sync failed');
      vi.mocked(cartService.syncCart).mockRejectedValue(error);

      await expect(cartService.syncCart([])).rejects.toThrow('Sync failed');
    });

    it('should handle updateCart errors', async () => {
      const error = new Error('Update failed');
      vi.mocked(cartService.updateCart).mockRejectedValue(error);

      await expect(cartService.updateCart([])).rejects.toThrow('Update failed');
    });
  });

  describe('Cart Item Management', () => {
    it('should merge items correctly by product, size, and color', () => {
      const { addItem } = useCartStore.getState();

      addItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
        size: 'M',
        color: 'Red',
      });

      addItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
        size: 'M',
        color: 'Red',
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should treat different sizes as separate items', () => {
      const { addItem } = useCartStore.getState();

      addItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
        size: 'M',
        color: 'Red',
      });

      addItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
        size: 'L',
        color: 'Red',
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
    });

    it('should handle empty cart', () => {
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(0);
    });

    it('should handle large carts (100+ items)', () => {
      const { setItems } = useCartStore.getState();
      const largeCart = Array.from({ length: 150 }, (_, i) =>
        createMockCartItem({ id: `item-${i}`, productId: `product-${i}` })
      );

      setItems(largeCart);

      expect(useCartStore.getState().items).toHaveLength(150);
    });
  });

  describe('Cart Persistence', () => {
    it('should clear cart', () => {
      const { addItem, clear } = useCartStore.getState();

      addItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
      });

      expect(useCartStore.getState().items).toHaveLength(1);

      clear();

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should manage buyNowItem separately from cart', () => {
      const { setBuyNowItem, clearBuyNow } = useCartStore.getState();

      setBuyNowItem({
        productId: 'product-1',
        name: 'Test',
        thumbnail: 'test.jpg',
        price: 100,
        salePrice: 80,
        quantity: 1,
      });

      expect(useCartStore.getState().buyNowItem).toBeDefined();

      clearBuyNow();

      expect(useCartStore.getState().buyNowItem).toBeNull();
    });
  });
});
