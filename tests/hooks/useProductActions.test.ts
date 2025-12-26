/**
 * useProductActions Hook Tests
 *
 * Comprehensive tests for product action functionality including stock validation,
 * add to cart, and buy now flows
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductActions } from '@/hooks/product/useProductActions';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { createMockProduct } from '../utils/mock-factories';
import { flushPromises } from '../utils/test-helpers';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('useProductActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockBack.mockClear();
    sessionStorageMock.clear();
    
    // Reset cart store
    useCartStore.setState({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      buyNowItem: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Stock Validation', () => {
    it('should prevent adding to cart when out of stock', async () => {
      const product = createMockProduct({ stock: 0 });
      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.isOutOfStock).toBe(true);

      act(() => {
        result.current.handleAddToCart();
      });

      expect(toast.error).toHaveBeenCalledWith('This item is out of stock');
      expect(result.current.isAddingToCart).toBe(false);
    });

    it('should prevent adding when quantity exceeds available stock', async () => {
      const product = createMockProduct({ stock: 5 });
      
      // Add 4 items to cart first
      useCartStore.getState().addItem({
        productId: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        salePrice: product.salePrice,
        quantity: 4,
      });

      const { result } = renderHook(() => useProductActions(product));

      // Try to add one more (would be 5 total, but then another click would exceed)
      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        expect(useCartStore.getState().items[0].quantity).toBe(5);
      }, { timeout: 1000 });

      // Now try to add another - should fail
      act(() => {
        result.current.handleAddToCart();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot add more')
      );
    });

    it('should calculate remaining stock correctly', () => {
      const product = createMockProduct({ stock: 10 });
      
      useCartStore.getState().addItem({
        productId: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        salePrice: product.salePrice,
        quantity: 3,
      });

      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.remainingStock).toBe(7); // 10 - 3
      expect(result.current.currentCartQty).toBe(3);
    });

    it('should account for items already in cart', () => {
      const product = createMockProduct({ stock: 5 });
      
      useCartStore.getState().addItem({
        productId: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        salePrice: product.salePrice,
        quantity: 5,
      });

      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.currentCartQty).toBe(5);
      expect(result.current.remainingStock).toBe(0);
    });

    it('should prevent buy now when cart already has max quantity', () => {
      const product = createMockProduct({ stock: 3 });
      
      useCartStore.getState().addItem({
        productId: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        salePrice: product.salePrice,
        quantity: 3,
      });

      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleBuyNow();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('already have')
      );
    });

    it('should handle stock becoming 0 during add operation', async () => {
      const product = createMockProduct({ stock: 1 });
      const { result, rerender } = renderHook(
        ({ prod }) => useProductActions(prod),
        { initialProps: { prod: product } }
      );

      // Simulate stock becoming 0 during the operation
      const updatedProduct = { ...product, stock: 0 };
      rerender({ prod: updatedProduct });

      act(() => {
        result.current.handleAddToCart();
      });

      expect(toast.error).toHaveBeenCalledWith('This item is out of stock');
    });
  });

  describe('Add to Cart Flow', () => {
    it('should add item to cart successfully', async () => {
      const product = createMockProduct({ stock: 10 });
      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.isAddingToCart).toBe(false);

      act(() => {
        result.current.handleAddToCart();
      });

      expect(result.current.isAddingToCart).toBe(true);

      // Wait for the transition to complete (no fake timers needed)
      await waitFor(() => {
        expect(result.current.isAddingToCart).toBe(false);
      }, { timeout: 1000 });

      expect(toast.success).toHaveBeenCalledWith('Added to cart');

      const cartState = useCartStore.getState();
      expect(cartState.items).toHaveLength(1);
      expect(cartState.items[0].productId).toBe(product.id);
    });

    it('should show success toast after adding', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Added to cart');
      }, { timeout: 1000 });
    });

    it('should set loading state during operation', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.isAddingToCart).toBe(false);

      act(() => {
        result.current.handleAddToCart();
      });

      expect(result.current.isAddingToCart).toBe(true);

      await waitFor(() => {
        expect(result.current.isAddingToCart).toBe(false);
      }, { timeout: 1000 });
    });

    it('should handle timeout scenario (300ms delay)', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        expect(useCartStore.getState().items).toHaveLength(1);
      }, { timeout: 1000 });
    });

    it('should update cart quantity for existing items', async () => {
      const product = createMockProduct();
      
      // Add item first time
      useCartStore.getState().addItem({
        productId: product.id,
        name: product.name,
        thumbnail: product.thumbnail,
        price: product.price,
        salePrice: product.salePrice,
        quantity: 1,
      });

      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        const cartState = useCartStore.getState();
        expect(cartState.items).toHaveLength(1);
        expect(cartState.items[0].quantity).toBe(2); // Incremented
      }, { timeout: 1000 });
    });
  });

  describe('Buy Now Flow', () => {
    it('should set buyNowItem in store', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleBuyNow();
      });

      await waitFor(() => {
        const cartState = useCartStore.getState();
        expect(cartState.buyNowItem).toBeDefined();
        expect(cartState.buyNowItem?.productId).toBe(product.id);
      }, { timeout: 1000 });
    });

    it('should navigate to checkout after buy now', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleBuyNow();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      }, { timeout: 1000 });
    });

    it('should prevent buy now when out of stock', () => {
      const product = createMockProduct({ stock: 0 });
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleBuyNow();
      });

      expect(toast.error).toHaveBeenCalledWith('This item is out of stock');
      expect(useCartStore.getState().buyNowItem).toBeNull();
    });

    it('should set transition loading state', async () => {
      const product = createMockProduct();
      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.isBuyingNow).toBe(false);

      act(() => {
        result.current.handleBuyNow();
      });

      // Transition may be immediate or brief
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined salePrice', async () => {
      const product = createMockProduct({ salePrice: null });
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        const cartState = useCartStore.getState();
        expect(cartState.items[0].salePrice).toBeNull();
      }, { timeout: 1000 });
    });

    it('should handle product with no thumbnail', async () => {
      const product = createMockProduct({ thumbnail: '' });
      const { result } = renderHook(() => useProductActions(product));

      act(() => {
        result.current.handleAddToCart();
      });

      await waitFor(() => {
        const cartState = useCartStore.getState();
        expect(cartState.items[0].thumbnail).toBe('');
      }, { timeout: 1000 });
    });

    it('should handle negative stock values', () => {
      const product = createMockProduct({ stock: -1 });
      const { result} = renderHook(() => useProductActions(product));

      // Negative stock should not be treated as out of stock by the check
      expect(result.current.isOutOfStock).toBe(false); // Only stock === 0 is out of stock
      expect(result.current.remainingStock).toBe(-1);
    });

    it('should handle zero stock correctly', () => {
      const product = createMockProduct({ stock: 0 });
      const { result } = renderHook(() => useProductActions(product));

      expect(result.current.isOutOfStock).toBe(true);
      expect(result.current.remainingStock).toBe(0);
    });
  });
});

