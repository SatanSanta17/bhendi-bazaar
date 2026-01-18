/**
 * Admin Product Repository
 * Handles database operations for product management
 */

import { prisma } from "@/lib/prisma";
import type {
  AdminProduct,
  ProductFilters,
  CreateProductInput,
  UpdateProductInput,
  ProductStats,
} from "../../domain/admin/product";
import { ProductFlag } from "../../types/products";
import { Prisma } from "@prisma/client";

// ✅ Efficient select - only fetch needed fields
const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  sku: true,
  price: true,
  salePrice: true,
  currency: true,
  rating: true,
  stock: true,
  lowStockThreshold: true,
  flags: true,
  thumbnail: true,
  createdAt: true,
  category: {
    select: { id: true, name: true },
  },
  seller: {
    select: { id: true, name: true, code: true },
  },
} satisfies Prisma.ProductSelect;

export class AdminProductRepository {
  /**
   * Get paginated list of products with filters
   */
  // server/repositories/admin/productRepository.ts

async getProducts(filters: ProductFilters) {
  const {
    page = 1,
    limit = 20,
    search,
    categoryId,
    sellerId,
    lowStock,      // ✅ ADD THIS
    outOfStock,    // ✅ ADD THIS
    sortBy,
    sortOrder,
  } = filters;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(sellerId && { sellerId }),
    // ✅ OUT OF STOCK FILTER
    ...(outOfStock && { stock: 0 }),
    // ✅ LOW STOCK: exclude zero stock if lowStock filter is active
    ...(lowStock && { stock: { gt: 0 } }),
  };

  // Build orderBy
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortBy === "name"
      ? { name: sortOrder || "asc" }
      : sortBy === "price"
      ? { price: sortOrder || "desc" }
      : sortBy === "stock"
      ? { stock: sortOrder || "desc" }
      : { createdAt: "desc" };

  // ✅ If low stock filter, we need to fetch more and filter in-memory
  if (lowStock) {
    const allProducts = await prisma.product.findMany({
      where,
      orderBy,
      select: PRODUCT_LIST_SELECT,
    });
    
    // Filter products where stock <= lowStockThreshold
    const filteredProducts = allProducts.filter(
      p => p.stock <= p.lowStockThreshold && p.stock > 0
    );
    
    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ✅ Standard query for other filters
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: PRODUCT_LIST_SELECT,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  /**
   * Get single product by ID
   */
  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, code: true } },
        reviews: {
          take: 5, // Only recent reviews
          orderBy: { createdAt: "desc" },
        },
      },
    });
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
        sellerId: data.sellerId || "",
        categoryId: data.categoryId,
        tags: data.tags || [],
        flags: data.flags || [],
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
      sellerId: product.sellerId,
      categoryId: product.categoryId,
      tags: product.tags,
      flags: product.flags as ProductFlag[],
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
      sellerId: product.sellerId,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      tags: product.tags,
      flags: product.flags as ProductFlag[],
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
  async getStats(): Promise<ProductStats> {
    const [totalProducts, outOfStockProducts, allProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.findMany({
        where: { stock: { gt: 0 } },
        select: {
          price: true,
          stock: true,
          lowStockThreshold: true,
          flags: true,
        },
      }),
    ]);

    // Filter low stock products and featured products in-memory
    const lowStockProducts = allProducts.filter(
      (p) => p.stock <= p.lowStockThreshold
    ).length;

    const featuredProducts = allProducts.filter((p) =>
      p.flags.includes(ProductFlag.FEATURED)
    ).length;

    const totalInventoryValue = allProducts.reduce((sum, product) => {
      return sum + product.price * product.stock;
    }, 0);

    return {
      totalProducts,
      lowStockProducts,
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
