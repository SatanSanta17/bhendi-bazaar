/**
 * Client-side Product Service Tests
 *
 * Tests for error handling, network failures, and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { productService, ProductService } from '@/services/productService';

global.fetch = vi.fn();

describe('Client ProductService - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('should throw error on 500 server error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(productService.getProducts()).rejects.toThrow(
        'Failed to fetch products'
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(productService.getProducts()).rejects.toThrow('Network error');
    });

    it('should throw error on timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timed out')
      );

      await expect(productService.getProducts()).rejects.toThrow(
        'Request timed out'
      );
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValueOnce(new SyntaxError('Unexpected token')),
      });

      await expect(productService.getProducts()).rejects.toThrow();
    });

    it('should build correct query params', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.getProducts({
        categorySlug: 'electronics',
        search: 'laptop',
        minPrice: 10000,
        maxPrice: 50000,
        offerOnly: true,
        featuredOnly: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('categorySlug=electronics')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=laptop')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('minPrice=10000')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxPrice=50000')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offerOnly=true')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('featuredOnly=true')
      );
    });
  });

  describe('getProductBySlug', () => {
    it('should throw "Product not found" on 404', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        productService.getProductBySlug('non-existent')
      ).rejects.toThrow('Product not found');
    });

    it('should throw generic error on other status codes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        productService.getProductBySlug('product-1')
      ).rejects.toThrow('Failed to fetch product');
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        productService.getProductBySlug('product-1')
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(
        productService.getProductBySlug('product-1')
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('getSimilarProducts', () => {
    it('should return empty array on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await productService.getSimilarProducts('product-1');
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await productService.getSimilarProducts('product-1');
      expect(result).toEqual([]);
    });

    it('should return empty array on timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Request timed out')
      );

      const result = await productService.getSimilarProducts('product-1');
      expect(result).toEqual([]);
    });

    it('should use correct limit parameter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.getSimilarProducts('product-1', 8);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=8')
      );
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return empty array on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await productService.getFeaturedProducts();
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await productService.getFeaturedProducts();
      expect(result).toEqual([]);
    });

    it('should use custom limit', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.getFeaturedProducts(10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10')
      );
    });
  });

  describe('getOfferProducts', () => {
    it('should return empty array on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await productService.getOfferProducts();
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await productService.getOfferProducts();
      expect(result).toEqual([]);
    });

    it('should use limit when provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.getOfferProducts(12);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=12')
      );
    });

    it('should not include limit in URL when not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.getOfferProducts();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('limit=')
      );
    });
  });

  describe('searchProducts', () => {
    it('should return empty array for short query', async () => {
      const result = await productService.searchProducts('a');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return empty array for empty query', async () => {
      const result = await productService.searchProducts('');
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await productService.searchProducts('laptop');
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await productService.searchProducts('laptop');
      expect(result).toEqual([]);
    });

    it('should use correct limit parameter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.searchProducts('laptop', 50);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });

    it('should handle special characters in search query', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce([]),
      });

      await productService.searchProducts('laptop & mouse');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=laptop')
      );
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle connection refused', async () => {
      (global.fetch as any).mockRejectedValueOnce({
        name: 'TypeError',
        message: 'Failed to fetch',
      });

      await expect(productService.getProducts()).rejects.toThrow();
    });

    it('should handle DNS failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND')
      );

      await expect(productService.getProducts()).rejects.toThrow(
        'getaddrinfo ENOTFOUND'
      );
    });

    it('should handle CORS error', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(productService.getProducts()).rejects.toThrow();
    });

    it('should handle aborted request', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new DOMException('Aborted', 'AbortError')
      );

      await expect(productService.getProducts()).rejects.toThrow();
    });
  });
});

