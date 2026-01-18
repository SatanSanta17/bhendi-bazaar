/**
 * ProductService Tests
 *
 * Tests for server-side product service business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  productService,
  ProductService,
} from "../../server/services/productService";
import { productRepository } from "../../server/repositories/productRepository";
import type { ServerProduct, ProductFilter } from "../../server/domain/product";

// Mock the product repository
vi.mock('@/server/repositories/productRepository', () => ({
  productRepository: {
    findBySlug: vi.fn(),
    list: vi.fn(),
    findSimilar: vi.fn(),
    getHeroProducts: vi.fn(),
    getOfferProducts: vi.fn(),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock product
  const createMockProduct = (overrides?: Partial<ServerProduct>): ServerProduct => ({
    id: 'product-1',
    slug: 'test-product',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    salePrice: null,
    currency: 'INR',
    categorySlug: 'test-category',
    tags: ['test'],
    isFeatured: false,
    isHero: false,
    isOnOffer: false,
    rating: 4.5,
    reviewsCount: 10,
    images: ['image1.jpg'],
    thumbnail: 'thumbnail.jpg',
    sizes: ['M', 'L'],
    colors: ['Red'],
    stock: 10,
    lowStockThreshold: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  describe('getProductBySlug', () => {
    it('should return a product when slug exists', async () => {
      const mockProduct = createMockProduct();
      vi.mocked(productRepository.findBySlug).mockResolvedValue(mockProduct);

      const result = await productService.getProductBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(productRepository.findBySlug).toHaveBeenCalledWith('test-product');
      expect(productRepository.findBySlug).toHaveBeenCalledTimes(1);
    });

    it('should return null when product not found', async () => {
      vi.mocked(productRepository.findBySlug).mockResolvedValue(null);

      const result = await productService.getProductBySlug('non-existent');

      expect(result).toBeNull();
      expect(productRepository.findBySlug).toHaveBeenCalledWith('non-existent');
    });

    it('should throw error for invalid slug (empty string)', async () => {
      await expect(productService.getProductBySlug('')).rejects.toThrow(
        'Invalid product slug'
      );

      expect(productRepository.findBySlug).not.toHaveBeenCalled();
    });

    it('should throw error for invalid slug (non-string)', async () => {
      await expect(
        productService.getProductBySlug(null as any)
      ).rejects.toThrow('Invalid product slug');

      await expect(
        productService.getProductBySlug(undefined as any)
      ).rejects.toThrow('Invalid product slug');

      expect(productRepository.findBySlug).not.toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should return all products without filter', async () => {
      const mockProducts = [
        createMockProduct({ id: '1', name: 'Product 1' }),
        createMockProduct({ id: '2', name: 'Product 2' }),
      ];
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.getProducts();

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered products', async () => {
      const mockProducts = [createMockProduct()];
      const filter: ProductFilter = {
        categorySlug: 'test-category',
        minPrice: 50,
        maxPrice: 150,
      };
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.getProducts(filter);

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith(filter);
    });

    it('should throw error for negative minPrice', async () => {
      const filter: ProductFilter = { minPrice: -10 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Minimum price cannot be negative'
      );

      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should throw error for negative maxPrice', async () => {
      const filter: ProductFilter = { maxPrice: -10 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Maximum price cannot be negative'
      );

      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should throw error when minPrice > maxPrice', async () => {
      const filter: ProductFilter = { minPrice: 200, maxPrice: 100 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Minimum price cannot be greater than maximum price'
      );

      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should throw error for invalid limit (< 1)', async () => {
      const filter: ProductFilter = { limit: 0 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should throw error for invalid limit (> 100)', async () => {
      const filter: ProductFilter = { limit: 101 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should throw error for negative offset', async () => {
      const filter: ProductFilter = { offset: -5 };

      await expect(productService.getProducts(filter)).rejects.toThrow(
        'Offset cannot be negative'
      );
    });

    it('should accept valid filter with all parameters', async () => {
      const mockProducts = [createMockProduct()];
      const filter: ProductFilter = {
        categorySlug: 'test',
        search: 'query',
        minPrice: 50,
        maxPrice: 150,
        offerOnly: true,
        featuredOnly: true,
        limit: 10,
        offset: 5,
      };
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.getProducts(filter);

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith(filter);
    });
  });

  describe('getSimilarProducts', () => {
    it('should return similar products with default limit', async () => {
      const mockProducts = [
        createMockProduct({ id: '1' }),
        createMockProduct({ id: '2' }),
        createMockProduct({ id: '3' }),
        createMockProduct({ id: '4' }),
      ];
      vi.mocked(productRepository.findSimilar).mockResolvedValue(mockProducts);

      const result = await productService.getSimilarProducts('test-product');

      expect(result).toEqual(mockProducts);
      expect(productRepository.findSimilar).toHaveBeenCalledWith('test-product', 4);
    });

    it('should return similar products with custom limit', async () => {
      const mockProducts = [
        createMockProduct({ id: '1' }),
        createMockProduct({ id: '2' }),
      ];
      vi.mocked(productRepository.findSimilar).mockResolvedValue(mockProducts);

      const result = await productService.getSimilarProducts('test-product', 2);

      expect(result).toEqual(mockProducts);
      expect(productRepository.findSimilar).toHaveBeenCalledWith('test-product', 2);
    });

    it('should throw error for invalid slug', async () => {
      await expect(productService.getSimilarProducts('')).rejects.toThrow(
        'Invalid product slug'
      );

      expect(productRepository.findSimilar).not.toHaveBeenCalled();
    });

    it('should throw error for limit < 1', async () => {
      await expect(productService.getSimilarProducts('test-product', 0)).rejects.toThrow(
        'Limit must be between 1 and 20'
      );
    });

    it('should throw error for limit > 20', async () => {
      await expect(productService.getSimilarProducts('test-product', 21)).rejects.toThrow(
        'Limit must be between 1 and 20'
      );
    });

    it('should accept limit boundary values (1 and 20)', async () => {
      const mockProducts = [createMockProduct()];
      vi.mocked(productRepository.findSimilar).mockResolvedValue(mockProducts);

      await productService.getSimilarProducts('test-product', 1);
      expect(productRepository.findSimilar).toHaveBeenCalledWith('test-product', 1);

      await productService.getSimilarProducts('test-product', 20);
      expect(productRepository.findSimilar).toHaveBeenCalledWith('test-product', 20);
    });
  });

  describe('getHeroProducts', () => {
    it('should return hero products with default limit', async () => {
      const mockProducts = Array.from({ length: 6 }, (_, i) =>
        createMockProduct({ id: `${i}`, isHero: true })
      );
      vi.mocked(productRepository.getHeroProducts).mockResolvedValue(mockProducts);

      const result = await productService.getHeroProducts();

      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(6);
      expect(productRepository.getHeroProducts).toHaveBeenCalledWith(6);
    });

    it('should return hero products with custom limit', async () => {
      const mockProducts = Array.from({ length: 3 }, (_, i) =>
        createMockProduct({ id: `${i}`, isHero: true })
      );
      vi.mocked(productRepository.getHeroProducts).mockResolvedValue(mockProducts);

      const result = await productService.getHeroProducts(3);

      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(3);
      expect(productRepository.getHeroProducts).toHaveBeenCalledWith(3);
    });

    it('should throw error for limit < 1', async () => {
      await expect(productService.getHeroProducts(0)).rejects.toThrow(
        'Limit must be between 1 and 20'
      );
    });

    it('should throw error for limit > 20', async () => {
      await expect(productService.getHeroProducts(21)).rejects.toThrow(
        'Limit must be between 1 and 20'
      );
    });

    it('should accept limit boundary values', async () => {
      const mockProducts = [createMockProduct()];
      vi.mocked(productRepository.getHeroProducts).mockResolvedValue(mockProducts);

      await productService.getHeroProducts(1);
      expect(productRepository.getHeroProducts).toHaveBeenCalledWith(1);

      await productService.getHeroProducts(20);
      expect(productRepository.getHeroProducts).toHaveBeenCalledWith(20);
    });
  });

  describe('getOfferProducts', () => {
    it('should return offer products without limit', async () => {
      const mockProducts = [
        createMockProduct({ id: '1', isOnOffer: true }),
        createMockProduct({ id: '2', isOnOffer: true }),
      ];
      vi.mocked(productRepository.getOfferProducts).mockResolvedValue(mockProducts);

      const result = await productService.getOfferProducts();

      expect(result).toEqual(mockProducts);
      expect(productRepository.getOfferProducts).toHaveBeenCalledWith(undefined);
    });

    it('should return offer products with limit', async () => {
      const mockProducts = [createMockProduct({ isOnOffer: true })];
      vi.mocked(productRepository.getOfferProducts).mockResolvedValue(mockProducts);

      const result = await productService.getOfferProducts(10);

      expect(result).toEqual(mockProducts);
      expect(productRepository.getOfferProducts).toHaveBeenCalledWith(10);
    });

    it('should throw error for limit < 1', async () => {
      await expect(productService.getOfferProducts(0)).rejects.toThrow(
        'Limit must be between 1 and 50'
      );
    });

    it('should throw error for limit > 50', async () => {
      await expect(productService.getOfferProducts(51)).rejects.toThrow(
        'Limit must be between 1 and 50'
      );
    });

    it('should accept limit boundary values', async () => {
      const mockProducts = [createMockProduct()];
      vi.mocked(productRepository.getOfferProducts).mockResolvedValue(mockProducts);

      await productService.getOfferProducts(1);
      expect(productRepository.getOfferProducts).toHaveBeenCalledWith(1);

      await productService.getOfferProducts(50);
      expect(productRepository.getOfferProducts).toHaveBeenCalledWith(50);
    });
  });

  describe('searchProducts', () => {
    it('should return search results for valid query', async () => {
      const mockProducts = [
        createMockProduct({ id: '1', name: 'Test Product 1' }),
        createMockProduct({ id: '2', name: 'Test Product 2' }),
      ];
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.searchProducts('test');

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith({
        search: 'test',
        limit: 20,
      });
    });

    it('should return search results with custom limit', async () => {
      const mockProducts = [createMockProduct()];
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.searchProducts('test', 5);

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith({
        search: 'test',
        limit: 5,
      });
    });

    it('should return empty array for empty query', async () => {
      const result = await productService.searchProducts('');

      expect(result).toEqual([]);
      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should return empty array for null/undefined query', async () => {
      const resultNull = await productService.searchProducts(null as any);
      expect(resultNull).toEqual([]);

      const resultUndefined = await productService.searchProducts(undefined as any);
      expect(resultUndefined).toEqual([]);

      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should throw error for query length < 2', async () => {
      await expect(productService.searchProducts('a')).rejects.toThrow(
        'Search query must be at least 2 characters'
      );

      expect(productRepository.list).not.toHaveBeenCalled();
    });

    it('should accept minimum valid query (2 characters)', async () => {
      const mockProducts = [createMockProduct()];
      vi.mocked(productRepository.list).mockResolvedValue(mockProducts);

      const result = await productService.searchProducts('ab');

      expect(result).toEqual(mockProducts);
      expect(productRepository.list).toHaveBeenCalledWith({
        search: 'ab',
        limit: 20,
      });
    });
  });

  describe('ProductService instance', () => {
    it('should export a singleton instance', () => {
      expect(productService).toBeInstanceOf(ProductService);
    });

    it('should be the same instance across imports', () => {
      const service1 = productService;
      const service2 = productService;

      expect(service1).toBe(service2);
    });
  });
});

