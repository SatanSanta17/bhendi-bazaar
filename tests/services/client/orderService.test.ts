/**
 * Client-side Order Service Tests
 *
 * Tests for error handling, network failures, HTTP status codes, and retries
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { orderService, CreateOrderInput } from '@/services/orderService';
import { createMockOrder, createMockCartItem } from '../../utils/mock-factories';

global.fetch = vi.fn();

describe('Client OrderService - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOrders', () => {
    it('should handle 401 unauthorized error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(orderService.getOrders()).rejects.toThrow('Unauthorized');
    });

    it('should handle 500 server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(orderService.getOrders()).rejects.toThrow('Failed to fetch orders');
    });

    it('should handle network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(orderService.getOrders()).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(orderService.getOrders()).rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValueOnce(new SyntaxError('Unexpected token')),
      });

      await expect(orderService.getOrders()).rejects.toThrow();
    });
  });

  describe('getOrderById', () => {
    it('should handle 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(orderService.getOrderById('order-123')).rejects.toThrow(
        'Order not found'
      );
    });

    it('should handle 403 forbidden', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(orderService.getOrderById('order-123')).rejects.toThrow(
        "You don't have permission"
      );
    });

    it('should handle generic error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(orderService.getOrderById('order-123')).rejects.toThrow(
        'Failed to fetch order'
      );
    });
  });

  describe('lookupOrderByCode', () => {
    it('should handle 429 rate limit with custom message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi
          .fn()
          .mockResolvedValueOnce({ error: 'Too many attempts. Wait 5 minutes.' }),
      });

      await expect(orderService.lookupOrderByCode('ABC123')).rejects.toThrow(
        'Too many attempts'
      );
    });

    it('should handle 429 rate limit with default message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValueOnce({}),
      });

      await expect(orderService.lookupOrderByCode('ABC123')).rejects.toThrow(
        'Too many requests'
      );
    });

    it('should handle 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(orderService.lookupOrderByCode('INVALID')).rejects.toThrow(
        'Order not found'
      );
    });

    it('should handle network error during lookup', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Failed to connect')
      );

      await expect(orderService.lookupOrderByCode('ABC123')).rejects.toThrow(
        'Failed to connect'
      );
    });
  });

  describe('createOrder', () => {
    const validInput: CreateOrderInput = {
      items: [createMockCartItem()],
      totals: {
        subtotal: 100,
        discount: 10,
        total: 90,
      },
      address: {
        name: 'John Doe',
        phone: '9876543210',
        line1: '123 Street',
        line2: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
    };

    it('should handle 429 rate limit error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: vi
          .fn()
          .mockResolvedValueOnce({ error: 'Rate limit exceeded. Try again in 1 minute.' }),
      });

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should handle 400 bad request with error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce({ error: 'Invalid order data' }),
      });

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Invalid order data'
      );
    });

    it('should handle 400 bad request without error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce({}),
      });

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Failed to create order'
      );
    });

    it('should handle malformed error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Failed to create order'
      );
    });

    it('should handle 500 server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValueOnce({ error: 'Internal server error' }),
      });

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle network timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timed out')
      );

      await expect(orderService.createOrder(validInput)).rejects.toThrow(
        'Request timed out'
      );
    });
  });

  describe('updateOrder', () => {
    it('should handle 403 forbidden error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(
        orderService.updateOrder('order-123', { status: 'shipped' })
      ).rejects.toThrow("You don't have permission");
    });

    it('should handle 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        orderService.updateOrder('order-123', { status: 'shipped' })
      ).rejects.toThrow('Order not found');
    });

    it('should handle 400 with error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce({ error: 'Invalid status transition' }),
      });

      await expect(
        orderService.updateOrder('order-123', { status: 'delivered' })
      ).rejects.toThrow('Invalid status transition');
    });

    it('should handle generic error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValueOnce(new Error('JSON parse error')),
      });

      await expect(
        orderService.updateOrder('order-123', { status: 'shipped' })
      ).rejects.toThrow('Failed to update order');
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle connection refused', async () => {
      (global.fetch as any).mockRejectedValueOnce({
        name: 'TypeError',
        message: 'Failed to fetch',
      });

      await expect(orderService.getOrders()).rejects.toThrow();
    });

    it('should handle DNS resolution failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND')
      );

      await expect(orderService.getOrders()).rejects.toThrow('getaddrinfo ENOTFOUND');
    });

    it('should handle aborted request', async () => {
      (global.fetch as any).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      await expect(orderService.getOrders()).rejects.toThrow();
    });
  });
});

