/**
 * OrderService Tests
 *
 * Tests for server-side order service business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { orderService, OrderService } from "../../server/services/orderService";
import { orderRepository } from "../../server/repositories/orderRepository";
import type {
  ServerOrder,
  CreateOrderInput,
  UpdateOrderInput,
  OrderItem,
  OrderAddress,
  OrderTotals,
} from "../../server/domain/order";

// Mock the order repository
vi.mock('@/server/repositories/orderRepository', () => ({
  orderRepository: {
    findById: vi.fn(),
    findByCode: vi.fn(),
    listByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock order address
  const createMockAddress = (overrides?: Partial<OrderAddress>): OrderAddress => ({
    fullName: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    line1: '123 Test Street',
    line2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    ...overrides,
  });

  // Helper function to create mock order item
  const createMockOrderItem = (overrides?: Partial<OrderItem>): OrderItem => ({
    productId: 'product-1',
    name: 'Test Product',
    thumbnail: 'test.jpg',
    price: 100,
    salePrice: null,
    quantity: 1,
    ...overrides,
  });

  // Helper function to create mock order totals
  const createMockTotals = (overrides?: Partial<OrderTotals>): OrderTotals => ({
    subtotal: 100,
    discount: 0,
    total: 100,
    ...overrides,
  });

  // Helper function to create mock order
  const createMockOrder = (overrides?: Partial<ServerOrder>): ServerOrder => ({
    id: 'order-1',
    code: 'BB-1001',
    userId: 'user-1',
    items: [createMockOrderItem()],
    totals: createMockTotals(),
    status: 'processing',
    address: createMockAddress(),
    notes: 'Test note',
    placedAt: '2024-01-01T00:00:00.000Z',
    estimatedDelivery: '2024-01-05T00:00:00.000Z',
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    ...overrides,
  });

  describe('getOrdersByUserId', () => {
    it('should return all orders for a user', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1' }),
        createMockOrder({ id: 'order-2' }),
      ];
      vi.mocked(orderRepository.listByUserId).mockResolvedValue(mockOrders);

      const result = await orderService.getOrdersByUserId('user-1');

      expect(result).toEqual(mockOrders);
      expect(orderRepository.listByUserId).toHaveBeenCalledWith('user-1');
      expect(orderRepository.listByUserId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no orders', async () => {
      vi.mocked(orderRepository.listByUserId).mockResolvedValue([]);

      const result = await orderService.getOrdersByUserId('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    it('should return order when found without userId check', async () => {
      const mockOrder = createMockOrder();
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('should return null when order not found', async () => {
      vi.mocked(orderRepository.findById).mockResolvedValue(null);

      const result = await orderService.getOrderById('non-existent');

      expect(result).toBeNull();
    });

    it('should return order when userId matches', async () => {
      const mockOrder = createMockOrder({ userId: 'user-1' });
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw error when userId does not match', async () => {
      const mockOrder = createMockOrder({ userId: 'user-1' });
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder);

      await expect(
        orderService.getOrderById('order-1', 'user-2')
      ).rejects.toThrow('Unauthorized: Order does not belong to user');
    });

    it('should allow access to guest order (no userId in order)', async () => {
      const mockOrder = createMockOrder({ userId: undefined });
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
    });

    it('should not throw error when userId provided but order has no userId', async () => {
      const mockOrder = createMockOrder({ userId: undefined });
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
    });
  });

  describe('lookupOrderByCode', () => {
    it('should return order when code exists', async () => {
      const mockOrder = createMockOrder({ code: 'BB-1001' });
      vi.mocked(orderRepository.findByCode).mockResolvedValue(mockOrder);

      const result = await orderService.lookupOrderByCode('BB-1001');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findByCode).toHaveBeenCalledWith('BB-1001');
    });

    it('should return null when code not found', async () => {
      vi.mocked(orderRepository.findByCode).mockResolvedValue(null);

      const result = await orderService.lookupOrderByCode('BB-9999');

      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create order with valid input', async () => {
      const input: CreateOrderInput = {
        userId: 'user-1',
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: createMockAddress(),
        notes: 'Test order',
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
      };
      const mockOrder = createMockOrder();
      vi.mocked(orderRepository.create).mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(input);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.create).toHaveBeenCalledWith(input);
    });

    it('should create guest order without userId', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: createMockAddress(),
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
      };
      const mockOrder = createMockOrder({ userId: undefined });
      vi.mocked(orderRepository.create).mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(input);

      expect(result).toEqual(mockOrder);
    });

    it('should throw error for empty items array', async () => {
      const input: CreateOrderInput = {
        items: [],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Order must contain at least one item'
      );

      expect(orderRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for missing item productId', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), productId: '' }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Invalid item data: missing required fields'
      );
    });

    it('should throw error for missing item name', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), name: '' }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Invalid item data: missing required fields'
      );
    });

    it('should throw error for missing item thumbnail', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), thumbnail: '' }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Invalid item data: missing required fields'
      );
    });

    it('should throw error for invalid item quantity (zero)', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), quantity: 0 }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Item quantity must be greater than 0'
      );
    });

    it('should throw error for invalid item quantity (negative)', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), quantity: -1 }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Item quantity must be greater than 0'
      );
    });

    it('should throw error for negative item price', async () => {
      const input: CreateOrderInput = {
        items: [{ ...createMockOrderItem(), price: -10 }],
        totals: createMockTotals(),
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Item price cannot be negative'
      );
    });

    it('should throw error for missing totals', async () => {
      const input = {
        items: [createMockOrderItem()],
        address: createMockAddress(),
      } as CreateOrderInput;

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Order totals are required'
      );
    });

    it('should throw error for zero total', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: { subtotal: 0, discount: 0, total: 0 },
        address: createMockAddress(),
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Order total must be greater than 0'
      );
    });

    it('should throw error for missing address', async () => {
      const input = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
      } as CreateOrderInput;

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Shipping address is required'
      );
    });

    it('should throw error for incomplete address (missing fullName)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), fullName: '' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Address is missing required fields'
      );
    });

    it('should throw error for incomplete address (missing phone)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), phone: '' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Address is missing required fields'
      );
    });

    it('should throw error for invalid phone format (not 10 digits)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), phone: '123' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Phone number must be 10 digits'
      );
    });

    it('should throw error for invalid phone format (contains letters)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), phone: '98765abcde' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Phone number must be 10 digits'
      );
    });

    it('should throw error for invalid postal code (not 6 digits)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), postalCode: '123' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Postal code must be 6 digits'
      );
    });

    it('should throw error for invalid postal code (contains letters)', async () => {
      const input: CreateOrderInput = {
        items: [createMockOrderItem()],
        totals: createMockTotals(),
        address: { ...createMockAddress(), postalCode: '40000a' },
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        'Postal code must be 6 digits'
      );
    });

    it('should accept order with multiple items', async () => {
      const input: CreateOrderInput = {
        items: [
          createMockOrderItem({ productId: '1' }),
          createMockOrderItem({ productId: '2' }),
          createMockOrderItem({ productId: '3' }),
        ],
        totals: { subtotal: 300, discount: 0, total: 300 },
        address: createMockAddress(),
      };
      const mockOrder = createMockOrder();
      vi.mocked(orderRepository.create).mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(input);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      const existingOrder = createMockOrder({ userId: 'user-1' });
      const updateInput: UpdateOrderInput = {
        status: 'shipped',
        paymentStatus: 'paid',
      };
      const updatedOrder = { ...existingOrder, ...updateInput };

      vi.mocked(orderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(orderRepository.update).mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder('order-1', updateInput, 'user-1');

      expect(result).toEqual(updatedOrder);
      expect(orderRepository.update).toHaveBeenCalledWith('order-1', updateInput);
    });

    it('should throw error when order not found', async () => {
      vi.mocked(orderRepository.findById).mockResolvedValue(null);

      await expect(
        orderService.updateOrder('order-1', { status: 'shipped' })
      ).rejects.toThrow('Order not found');

      expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when userId does not match', async () => {
      const existingOrder = createMockOrder({ userId: 'user-1' });
      vi.mocked(orderRepository.findById).mockResolvedValue(existingOrder);

      await expect(
        orderService.updateOrder('order-1', { status: 'shipped' }, 'user-2')
      ).rejects.toThrow('Unauthorized: Order does not belong to user');

      expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const existingOrder = createMockOrder();
      vi.mocked(orderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(orderRepository.update).mockResolvedValue(null);

      await expect(
        orderService.updateOrder('order-1', { status: 'shipped' })
      ).rejects.toThrow('Failed to update order');
    });

    it('should allow updating without userId check', async () => {
      const existingOrder = createMockOrder();
      const updateInput: UpdateOrderInput = { status: 'delivered' };
      const updatedOrder = { ...existingOrder, ...updateInput };

      vi.mocked(orderRepository.findById).mockResolvedValue(existingOrder);
      vi.mocked(orderRepository.update).mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrder('order-1', updateInput);

      expect(result).toEqual(updatedOrder);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully', async () => {
      vi.mocked(orderRepository.delete).mockResolvedValue();

      await orderService.deleteOrder('order-1');

      expect(orderRepository.delete).toHaveBeenCalledWith('order-1');
      expect(orderRepository.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('OrderService instance', () => {
    it('should export a singleton instance', () => {
      expect(orderService).toBeInstanceOf(OrderService);
    });

    it('should be the same instance across imports', () => {
      const service1 = orderService;
      const service2 = orderService;

      expect(service1).toBe(service2);
    });
  });
});

