/**
 * Server-side Product Repository
 *
 * This repository handles all database operations for products.
 * Currently uses mock data, will be replaced with Prisma once schema is ready.
 */

import { products } from "@/data/products";
import type { ServerProduct, ProductFilter } from "@/server/domain/product";
import type { Product } from "@/domain/product";

/**
 * Convert client Product to ServerProduct
 */
function toServerProduct(product: Product): ServerProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice ?? null,
    currency: product.currency,
    categorySlug: product.categorySlug,
    tags: product.tags,
    isFeatured: product.isFeatured ?? false,
    isHero: product.isHero ?? false,
    isOnOffer: product.isOnOffer ?? false,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    images: product.images,
    thumbnail: product.thumbnail,
    sizes: product.options?.sizes ?? [],
    colors: product.options?.colors ?? [],
    stock: 100, // Mock stock
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Convert ServerProduct to client Product
 */
function toClientProduct(product: ServerProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice ?? undefined,
    currency: product.currency,
    categorySlug: product.categorySlug,
    tags: product.tags,
    isFeatured: product.isFeatured || undefined,
    isHero: product.isHero || undefined,
    isOnOffer: product.isOnOffer || undefined,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    images: product.images,
    thumbnail: product.thumbnail,
    options: {
      sizes: product.sizes.length > 0 ? product.sizes : undefined,
      colors: product.colors.length > 0 ? product.colors : undefined,
    },
  };
}

export class ProductRepository {
  /**
   * List products with optional filtering
   */
  async list(filter?: ProductFilter): Promise<ServerProduct[]> {
    // Convert mock products to server products
    let result = products.map(toServerProduct);

    // Apply filters
    if (filter?.categorySlug) {
      result = result.filter((p) => p.categorySlug === filter.categorySlug);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filter?.offerOnly) {
      result = result.filter((p) => p.isOnOffer || p.salePrice !== null);
    }

    if (filter?.featuredOnly) {
      result = result.filter((p) => p.isFeatured);
    }

    if (filter?.minPrice != null) {
      result = result.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice != null) {
      result = result.filter((p) => p.price <= filter.maxPrice!);
    }

    // Apply pagination
    if (filter?.offset != null) {
      result = result.slice(filter.offset);
    }

    if (filter?.limit != null) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string): Promise<ServerProduct | null> {
    const product = products.find((p) => p.slug === slug);
    return product ? toServerProduct(product) : null;
  }

  /**
   * Find similar products
   */
  async findSimilar(slug: string, limit = 4): Promise<ServerProduct[]> {
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];

    const serverProduct = toServerProduct(product);

    const similar = products
      .filter(
        (p) =>
          p.slug !== slug &&
          (p.categorySlug === serverProduct.categorySlug ||
            p.tags.some((t) => serverProduct.tags.includes(t)))
      )
      .slice(0, limit)
      .map(toServerProduct);

    return similar;
  }

  /**
   * Get hero/featured products for homepage
   */
  async getHeroProducts(limit = 6): Promise<ServerProduct[]> {
    return products
      .filter((p) => p.isHero || p.isFeatured)
      .slice(0, limit)
      .map(toServerProduct);
  }

  /**
   * Get products on offer
   */
  async getOfferProducts(limit?: number): Promise<ServerProduct[]> {
    const offers = products
      .filter((p) => p.isOnOffer || p.salePrice)
      .map(toServerProduct);

    return limit ? offers.slice(0, limit) : offers;
  }
}

export const productRepository = new ProductRepository();
