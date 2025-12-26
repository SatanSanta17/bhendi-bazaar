/**
 * CartStore Tests
 *
 * Tests for Zustand cart store state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCartStore } from '@/store/cartStore';
import type { CartItem } from '@/domain/cart';

// Mock fetch globally
global.fetch = vi.fn();

describe('CartStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCartStore.setState({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      buyNowItem: null,
      isSyncing: false,
      lastSyncError: null,
    });
    vi.clearAllMocks();
  });

  // Helper to create mock cart item
  const createMockItem = (overrides?: Partial<CartItem>): Omit<CartItem, 'id'> => ({
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

  describe('addItem', () => {
    it('should add new item to cart', () => {
      const { addItem } = useCartStore.getState();
      const item = createMockItem();

      addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject(item);
      expect(state.items[0].id).toBeDefined();
    });

    it('should increment quantity if same item exists', () => {
      const { addItem } = useCartStore.getState();
      const item = createMockItem({ quantity: 2 });

      addItem(item);
      addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(4); // 2 + 2
    });

    it('should treat different sizes as different items', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ size: 'M' }));
      addItem(createMockItem({ size: 'L' }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });

    it('should treat different colors as different items', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ color: 'Red' }));
      addItem(createMockItem({ color: 'Blue' }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });

    it('should update totals after adding item', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 80, quantity: 2 }));

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(200); // 100 * 2
      expect(state.discount).toBe(40);  // (100 - 80) * 2
      expect(state.total).toBe(160);    // 200 - 40
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { addItem, removeItem } = useCartStore.getState();
      const item = createMockItem();

      addItem(item);
      const itemId = useCartStore.getState().items[0].id;

      removeItem(itemId);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should update totals after removing item', () => {
      const { addItem, removeItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 80, quantity: 1 }));
      addItem(createMockItem({ productId: 'product-2', price: 50, salePrice: 50, quantity: 1 }));

      const itemId = useCartStore.getState().items[0].id;
      removeItem(itemId);

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(50);
      expect(state.total).toBe(50);
    });

    it('should handle removing non-existent item', () => {
      const { addItem, removeItem } = useCartStore.getState();

      addItem(createMockItem());
      const initialLength = useCartStore.getState().items.length;

      removeItem('non-existent-id');

      expect(useCartStore.getState().items).toHaveLength(initialLength);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem, updateQuantity } = useCartStore.getState();

      addItem(createMockItem({ quantity: 1 }));
      const itemId = useCartStore.getState().items[0].id;

      updateQuantity(itemId, 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      const { addItem, updateQuantity } = useCartStore.getState();

      addItem(createMockItem({ quantity: 1 }));
      const itemId = useCartStore.getState().items[0].id;

      updateQuantity(itemId, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should update totals after quantity change', () => {
      const { addItem, updateQuantity } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 80, quantity: 1 }));
      const itemId = useCartStore.getState().items[0].id;

      updateQuantity(itemId, 3);

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(300); // 100 * 3
      expect(state.discount).toBe(60);  // (100 - 80) * 3
      expect(state.total).toBe(240);    // 300 - 60
    });
  });

  describe('updateQuantityWithLimit', () => {
    it('should update quantity when within limit', () => {
      const { addItem, updateQuantityWithLimit } = useCartStore.getState();

      addItem(createMockItem({ quantity: 1 }));
      const itemId = useCartStore.getState().items[0].id;

      const success = updateQuantityWithLimit(itemId, 5, 10);

      expect(success).toBe(true);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should not update quantity when exceeding limit', () => {
      const { addItem, updateQuantityWithLimit } = useCartStore.getState();

      addItem(createMockItem({ quantity: 1 }));
      const itemId = useCartStore.getState().items[0].id;

      const success = updateQuantityWithLimit(itemId, 15, 10);

      expect(success).toBe(false);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it('should return false for non-existent item', () => {
      const { updateQuantityWithLimit } = useCartStore.getState();

      const success = updateQuantityWithLimit('non-existent', 5, 10);

      expect(success).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      const { addItem, clear } = useCartStore.getState();

      addItem(createMockItem());
      addItem(createMockItem({ productId: 'product-2' }));

      clear();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.subtotal).toBe(0);
      expect(state.discount).toBe(0);
      expect(state.total).toBe(0);
    });
  });

  describe('buyNowItem', () => {
    it('should set buy now item', () => {
      const { setBuyNowItem } = useCartStore.getState();
      const item = createMockItem();

      setBuyNowItem(item);

      const state = useCartStore.getState();
      expect(state.buyNowItem).toMatchObject(item);
      expect(state.buyNowItem?.id).toBeDefined();
      expect(state.buyNowItem?.id).toContain('buynow');
    });

    it('should clear buy now item', () => {
      const { setBuyNowItem, clearBuyNow } = useCartStore.getState();

      setBuyNowItem(createMockItem());
      clearBuyNow();

      expect(useCartStore.getState().buyNowItem).toBeNull();
    });

    it('should set buyNowItem to null when passed null', () => {
      const { setBuyNowItem } = useCartStore.getState();

      setBuyNowItem(createMockItem());
      setBuyNowItem(null);

      expect(useCartStore.getState().buyNowItem).toBeNull();
    });
  });

  describe('setItems', () => {
    it('should replace all items', () => {
      const { setItems } = useCartStore.getState();
      const newItems: CartItem[] = [
        { ...createMockItem(), id: 'item-1' },
        { ...createMockItem({ productId: 'product-2' }), id: 'item-2' },
      ];

      setItems(newItems);

      const state = useCartStore.getState();
      expect(state.items).toEqual(newItems);
    });

    it('should calculate totals for new items', () => {
      const { setItems } = useCartStore.getState();
      const newItems: CartItem[] = [
        { ...createMockItem({ price: 100, salePrice: 80, quantity: 2 }), id: 'item-1' },
        { ...createMockItem({ productId: 'product-2', price: 50, salePrice: undefined, quantity: 1 }), id: 'item-2' },
      ];

      setItems(newItems);

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(state.discount).toBe(40);  // (100 - 80) * 2
      expect(state.total).toBe(210);    // 250 - 40
    });
  });

  describe('totals calculation', () => {
    it('should calculate subtotal correctly', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, quantity: 2 }));
      addItem(createMockItem({ productId: 'product-2', price: 50, quantity: 3 }));

      expect(useCartStore.getState().subtotal).toBe(350); // (100 * 2) + (50 * 3)
    });

    it('should calculate discount correctly with sale price', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 70, quantity: 2 }));

      expect(useCartStore.getState().discount).toBe(60); // (100 - 70) * 2
    });

    it('should calculate discount as 0 when no sale price', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: undefined, quantity: 2 }));

      expect(useCartStore.getState().discount).toBe(0);
    });

    it('should calculate total as subtotal minus discount', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 80, quantity: 2 }));

      const state = useCartStore.getState();
      expect(state.total).toBe(state.subtotal - state.discount);
      expect(state.total).toBe(160); // 200 - 40
    });
  });

  describe('sync state', () => {
    it('should set syncing state', () => {
      const { setSyncing } = useCartStore.getState();

      setSyncing(true);
      expect(useCartStore.getState().isSyncing).toBe(true);

      setSyncing(false);
      expect(useCartStore.getState().isSyncing).toBe(false);
    });

    it('should set sync error', () => {
      const { setSyncError } = useCartStore.getState();
      const errorMessage = 'Sync failed';

      setSyncError(errorMessage);
      expect(useCartStore.getState().lastSyncError).toBe(errorMessage);

      setSyncError(null);
      expect(useCartStore.getState().lastSyncError).toBeNull();
    });
  });

  describe('checkStockAvailability', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return available true for empty cart', async () => {
      const { checkStockAvailability } = useCartStore.getState();

      const result = await checkStockAvailability();

      expect(result.available).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should check stock for cart items', async () => {
      const { addItem, checkStockAvailability } = useCartStore.getState();

      addItem(createMockItem({ productId: 'product-1', quantity: 2 }));

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true, items: [] }),
      } as Response);

      const result = await checkStockAvailability();

      expect(result.available).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/products/check-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'product-1', quantity: 2 }],
        }),
      });
    });

    it('should return issues when stock is unavailable', async () => {
      const { addItem, checkStockAvailability } = useCartStore.getState();

      addItem(createMockItem({ productId: 'product-1', quantity: 10 }));

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          available: false,
          items: [
            {
              productId: 'product-1',
              name: 'Test Product',
              available: false,
              stock: 5,
              requested: 10,
            },
          ],
        }),
      } as Response);

      const result = await checkStockAvailability();

      expect(result.available).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].productId).toBe('product-1');
      expect(result.issues[0].message).toContain('Only 5 available');
    });

    it('should handle fetch error', async () => {
      const { addItem, checkStockAvailability } = useCartStore.getState();

      addItem(createMockItem());

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkStockAvailability();

      expect(result.available).toBe(false);
      expect(result.issues[0].message).toBe('Failed to verify stock availability');
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple items with mixed prices', () => {
      const { addItem } = useCartStore.getState();

      addItem(createMockItem({ price: 100, salePrice: 80, quantity: 2 }));
      addItem(createMockItem({ productId: 'product-2', price: 50, salePrice: undefined, quantity: 3 }));
      addItem(createMockItem({ productId: 'product-3', price: 200, salePrice: 150, quantity: 1 }));

      const state = useCartStore.getState();
      expect(state.subtotal).toBe(550); // (100*2) + (50*3) + (200*1)
      expect(state.discount).toBe(90);  // (20*2) + (0) + (50*1)
      expect(state.total).toBe(460);    // 550 - 90
    });

    it('should maintain correct state through multiple operations', () => {
      const { addItem, updateQuantity, removeItem } = useCartStore.getState();

      // Add items
      addItem(createMockItem({ productId: 'p1', price: 100, quantity: 2 }));
      addItem(createMockItem({ productId: 'p2', price: 50, quantity: 1 }));

      const p1Id = useCartStore.getState().items.find(i => i.productId === 'p1')!.id;
      const p2Id = useCartStore.getState().items.find(i => i.productId === 'p2')!.id;

      // Update quantity
      updateQuantity(p1Id, 3);

      // Remove one item
      removeItem(p2Id);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
      expect(state.subtotal).toBe(300); // 100 * 3
    });
  });
});

