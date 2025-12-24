/**
 * Server-side Product Repository
 *
 * This repository handles all database operations for products.
 */

import { prisma } from "@/lib/prisma";
import type { ServerProduct, ProductFilter } from "@/server/domain/product";
import type { Product } from "@/domain/product";

/**
 * Convert Prisma Product to ServerProduct
 */
function toServerProduct(product: any): ServerProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice,
    currency: product.currency,
    categorySlug: product.category?.slug || "",
    tags: product.tags,
    isFeatured: product.isFeatured,
    isHero: product.isHero,
    isOnOffer: product.isOnOffer,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    images: product.images,
    thumbnail: product.thumbnail,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold || 10,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
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
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
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
    const where: any = {};

    // Apply category filter
    if (filter?.categorySlug) {
      where.category = {
        slug: filter.categorySlug,
      };
    }

    // Apply search filter
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
        { tags: { hasSome: [filter.search] } },
      ];
    }

    // Apply price filters
    if (filter?.minPrice !== undefined) {
      where.price = { ...where.price, gte: filter.minPrice };
    }
    if (filter?.maxPrice !== undefined) {
      where.price = { ...where.price, lte: filter.maxPrice };
    }

    // Apply offer filter
    if (filter?.offerOnly) {
      where.isOnOffer = true;
    }

    // Apply featured filter
    if (filter?.featuredOnly) {
      where.isFeatured = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filter?.limit,
      skip: filter?.offset,
    });

    return products.map(toServerProduct);
  }

  /**
   * Find a product by slug
   */
  async findBySlug(slug: string): Promise<ServerProduct | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { slug: true, name: true },
        },
      },
    });

    if (!product) return null;
    return toServerProduct(product);
  }

  /**
   * Find similar products
   */
  async findSimilar(slug: string, limit = 4): Promise<ServerProduct[]> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) return [];

    const similar = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        slug: { not: slug },
      },
      include: {
        category: {
          select: { slug: true },
        },
      },
      take: limit,
      orderBy: { rating: "desc" },
    });

    return similar.map(toServerProduct);
  }

  /**
   * Get hero products for homepage
   */
  async getHeroProducts(limit = 6): Promise<ServerProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        isHero: true,
      },
      include: {
        category: {
          select: { slug: true },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map(toServerProduct);
  }

  /**
   * Get products on offer
   */
  async getOfferProducts(limit?: number): Promise<ServerProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        isOnOffer: true,
      },
      include: {
        category: {
          select: { slug: true },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map(toServerProduct);
  }

  /**
   * Convert to client-facing Product
   */
  toClient(serverProduct: ServerProduct): Product {
    return toClientProduct(serverProduct);
  }
}

export const productRepository = new ProductRepository();