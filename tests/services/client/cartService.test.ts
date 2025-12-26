/**
 * Client-side Cart Service Tests
 *
 * Tests for error handling, network failures, and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cartService, CartService } from '@/services/cartService';
import { createMockCartItem } from '../../utils/mock-factories';

global.fetch = vi.fn();

describe('Client CartService - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCart', () => {
    it('should return empty array on 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should return empty array on 500 server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValueOnce(new SyntaxError('Unexpected token')),
      });

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should handle response without items field', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({}),
      });

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should handle timeout error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });
  });

  describe('syncCart', () => {
    const mockItems = [createMockCartItem()];

    it('should return local items on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await cartService.syncCart(mockItems);
      expect(result).toEqual(mockItems);
    });

    it('should return local items on 500 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await cartService.syncCart(mockItems);
      expect(result).toEqual(mockItems);
    });

    it('should return local items on timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timed out')
      );

      const result = await cartService.syncCart(mockItems);
      expect(result).toEqual(mockItems);
    });

    it('should handle malformed response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      });

      const result = await cartService.syncCart(mockItems);
      expect(result).toEqual(mockItems);
    });

    it('should return empty array if response has no items', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({}),
      });

      const result = await cartService.syncCart(mockItems);
      expect(result).toEqual([]);
    });
  });

  describe('updateCart', () => {
    const mockItems = [createMockCartItem()];

    it('should handle network error silently', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(cartService.updateCart(mockItems)).resolves.toBeUndefined();
    });

    it('should handle 500 error silently', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(cartService.updateCart(mockItems)).resolves.toBeUndefined();
    });

    it('should handle 400 bad request silently', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(cartService.updateCart(mockItems)).resolves.toBeUndefined();
    });

    it('should handle timeout silently', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timed out')
      );

      await expect(cartService.updateCart(mockItems)).resolves.toBeUndefined();
    });
  });

  describe('clearCart', () => {
    it('should handle network error silently', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(cartService.clearCart()).resolves.toBeUndefined();
    });

    it('should handle 500 error silently', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(cartService.clearCart()).resolves.toBeUndefined();
    });

    it('should handle 404 not found silently', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(cartService.clearCart()).resolves.toBeUndefined();
    });

    it('should handle aborted request', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new DOMException('Aborted', 'AbortError')
      );

      await expect(cartService.clearCart()).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle connection refused', async () => {
      (global.fetch as any).mockRejectedValueOnce({
        name: 'TypeError',
        message: 'Failed to fetch',
      });

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should handle CORS error', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });

    it('should handle DNS failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND')
      );

      const result = await cartService.getCart();
      expect(result).toEqual([]);
    });
  });
});

