/**
 * Admin Product Repository
 * Handles database operations for product management
 */

import { prisma } from "@/lib/prisma";
import type {
  AdminProduct,
  ProductListFilters,
  CreateProductInput,
  UpdateProductInput,
  ProductStats,
} from "@/server/domain/admin/product";

export class AdminProductRepository {
  /**
   * Get paginated list of products with filters
   */
  async getProducts(filters: ProductListFilters) {
    const {
      search,
      categoryId,
      isFeatured,
      isOnOffer,
      lowStock,
      outOfStock,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (typeof isFeatured === "boolean") {
      where.isFeatured = isFeatured;
    }

    if (typeof isOnOffer === "boolean") {
      where.isOnOffer = isOnOffer;
    }

    if (outOfStock) {
      where.stock = 0;
    } else if (lowStock) {
      where.stock = {
        lte: prisma.$queryRaw`"lowStockThreshold"`,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const adminProducts: AdminProduct[] = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      currency: product.currency,
      categoryId: product.categoryId,
      categoryName: product.category.name,
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
      sku: product.sku,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return { products: adminProducts, total };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<AdminProduct | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      currency: product.currency,
      categoryId: product.categoryId,
      categoryName: product.category.name,
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
      sku: product.sku,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductInput): Promise<AdminProduct> {
    const product = await prisma.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        currency: data.currency || "INR",
        categoryId: data.categoryId,
        tags: data.tags || [],
        isFeatured: data.isFeatured || false,
        isHero: data.isHero || false,
        isOnOffer: data.isOnOffer || false,
        images: data.images,
        thumbnail: data.thumbnail,
        sizes: data.sizes || [],
        colors: data.colors || [],
        stock: data.stock,
        sku: data.sku,
        lowStockThreshold: data.lowStockThreshold || 10,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      currency: product.currency,
      categoryId: product.categoryId,
      categoryName: product.category.name,
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
      sku: product.sku,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    data: UpdateProductInput
  ): Promise<AdminProduct | null> {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      currency: product.currency,
      categoryId: product.categoryId,
      categoryName: product.category.name,
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
      sku: product.sku,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      featuredProducts,
      allProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count 
        FROM "Product" 
        WHERE stock <= "lowStockThreshold" AND stock > 0
      `,
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.product.findMany({
        select: {
          price: true,
          stock: true,
        },
      }),
    ]);

    const totalInventoryValue = allProducts.reduce((sum, product) => {
      return sum + product.price * product.stock;
    }, 0);

    return {
      totalProducts,
      lowStockProducts: Number(lowStockProducts[0]?.count || 0),
      outOfStockProducts,
      featuredProducts,
      totalInventoryValue,
    };
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(updates: { id: string; stock: number }[]) {
    const promises = updates.map((update) =>
      prisma.product.update({
        where: { id: update.id },
        data: { stock: update.stock },
      })
    );

    await Promise.all(promises);
  }
}

export const adminProductRepository = new AdminProductRepository();


