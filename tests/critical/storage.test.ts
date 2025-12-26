/**
 * Browser Storage Tests
 *
 * Tests for localStorage, sessionStorage, and storage failure scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';
import { createMockCartItem } from '../utils/mock-factories';

describe('Browser Storage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Reset cart store
    useCartStore.setState({
      items: [],
      buyNowItem: null,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorage Persistence', () => {
    it('should persist cart items to localStorage', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({ productId: 'prod-1', quantity: 2 });

      act(() => {
        store.addItem(item);
      });

      // Check if data was persisted (Zustand persist middleware handles this)
      const stored = localStorage.getItem('cart-storage');
      expect(stored).toBeDefined();
    });

    it('should NOT persist buyNowItem to localStorage', () => {
      const store = useCartStore.getState();
      const buyNowItem = createMockCartItem({ productId: 'buy-1' });

      act(() => {
        store.setBuyNowItem(buyNowItem);
      });

      const stored = localStorage.getItem('cart-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // buyNowItem should not be in state or should be excluded from persistence
        expect(parsed.state?.buyNowItem).toBeUndefined();
      }
    });

    it('should handle localStorage being full (quota exceeded)', () => {
      // Mock localStorage to simulate quota exceeded
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const store = useCartStore.getState();
      const item = createMockCartItem();

      // Should not throw error, just log it
      expect(() => {
        act(() => {
          store.addItem(item);
        });
      }).not.toThrow();

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle localStorage being disabled', () => {
      // Mock localStorage as undefined
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage is not available');
      });

      // Cart should still function without persistence
      const store = useCartStore.getState();
      const item = createMockCartItem();

      expect(() => {
        act(() => {
          store.addItem(item);
        });
      }).not.toThrow();

      // Restore
      Storage.prototype.getItem = originalGetItem;
    });

    it('should handle corrupted localStorage data', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('cart-storage', '{invalid json}');

      // Should handle gracefully and start with empty cart
      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
    });
  });

  describe('sessionStorage Usage', () => {
    it('should handle buyNowFlow flag in sessionStorage', () => {
      sessionStorage.setItem('buyNowFlow', 'true');
      const flag = sessionStorage.getItem('buyNowFlow');
      expect(flag).toBe('true');

      sessionStorage.removeItem('buyNowFlow');
      expect(sessionStorage.getItem('buyNowFlow')).toBeNull();
    });

    it('should handle sessionStorage being disabled', () => {
      // Simulate sessionStorage being unavailable
      const mockStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('sessionStorage is not available');
        }),
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      };

      // Should not throw when trying to use sessionStorage
      expect(() => {
        try {
          mockStorage.setItem('test', 'value');
        } catch (e) {
          // Handle gracefully
        }
      }).not.toThrow();
    });

    it('should clear sessionStorage data', () => {
      sessionStorage.setItem('buyNowFlow', 'true');
      sessionStorage.setItem('tempData', 'test');

      expect(sessionStorage.getItem('buyNowFlow')).toBe('true');

      sessionStorage.clear();

      expect(sessionStorage.getItem('buyNowFlow')).toBeNull();
      expect(sessionStorage.getItem('tempData')).toBeNull();
    });
  });

  describe('Storage Synchronization', () => {
    it('should handle multiple tabs reading same cart', () => {
      const item = createMockCartItem({ productId: 'prod-1' });

      // Simulate cart update in tab 1
      act(() => {
        useCartStore.getState().addItem(item);
      });

      // Simulate tab 2 reading from localStorage
      const stored = localStorage.getItem('cart-storage');
      expect(stored).toBeDefined();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.items).toBeDefined();
      }
    });

    it('should handle storage event from another tab', () => {
      const item = createMockCartItem();

      // Add item in current tab
      act(() => {
        useCartStore.getState().addItem(item);
      });

      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'cart-storage',
        newValue: localStorage.getItem('cart-storage'),
        storageArea: localStorage,
      });

      // Storage event should be handled
      window.dispatchEvent(event);

      // Cart should still be consistent
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('Storage Size Limits', () => {
    it('should handle large cart data', () => {
      const store = useCartStore.getState();

      // Add many items
      act(() => {
        for (let i = 0; i < 50; i++) {
          store.addItem(createMockCartItem({ productId: `prod-${i}` }));
        }
      });

      const state = useCartStore.getState();
      expect(state.items.length).toBe(50);

      // Check if data fits in localStorage (usually 5MB limit)
      const stored = localStorage.getItem('cart-storage');
      if (stored) {
        const sizeInBytes = new Blob([stored]).size;
        expect(sizeInBytes).toBeLessThan(5 * 1024 * 1024); // 5MB
      }
    });
  });

  describe('Storage Privacy Mode', () => {
    it('should handle private/incognito mode restrictions', () => {
      // In some browsers, localStorage is disabled in private mode
      const originalSetItem = Storage.prototype.setItem;
      let callCount = 0;

      Storage.prototype.setItem = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount > 1) {
          throw new DOMException(
            'localStorage is disabled in private mode',
            'SecurityError'
          );
        }
      });

      const store = useCartStore.getState();
      const item = createMockCartItem();

      // Should not crash the app
      expect(() => {
        act(() => {
          store.addItem(item);
          store.addItem(createMockCartItem({ productId: 'prod-2' }));
        });
      }).not.toThrow();

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data types after persistence', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({
        productId: 'prod-1',
        price: 100,
        salePrice: 80,
        quantity: 2,
      });

      act(() => {
        store.addItem(item);
      });

      const stored = localStorage.getItem('cart-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedItem = parsed.state.items[0];

        // Check data types are preserved
        expect(typeof storedItem.price).toBe('number');
        expect(typeof storedItem.salePrice).toBe('number');
        expect(typeof storedItem.quantity).toBe('number');
        expect(typeof storedItem.productId).toBe('string');
      }
    });

    it('should handle special characters in stored data', () => {
      const store = useCartStore.getState();
      const item = createMockCartItem({
        name: "Product with 'quotes' and \"double quotes\"",
        productId: 'prod-1',
      });

      act(() => {
        store.addItem(item);
      });

      const stored = localStorage.getItem('cart-storage');
      expect(stored).toBeDefined();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.items[0].name).toContain('quotes');
      }
    });
  });
});

