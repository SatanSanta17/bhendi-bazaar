// src/data-access-layer/products.dal.ts

// fetch product direct from the database using repository pattern

import { productsRepository } from "@server/repositories/products.repository";
import { Product, ProductFilter } from "@/domain/product";
import { ProductFlag } from "@/types/product";

const mapProduct = (product: any): Product => {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice ?? undefined,
    currency: product.currency,
    categorySlug: product.category.slug,
    tags: product.tags,
    flags: product.flags as ProductFlag[],
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    images: product.images,
    thumbnail: product.thumbnail,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    shippingFromPincode: product.shippingFromPincode ?? "",
    seller: {
      id: product.seller.id,
      name: product.seller.name,
      code: product.seller.code,
      defaultPincode: product.seller.defaultPincode,
      defaultCity: product.seller.defaultCity,
      defaultState: product.seller.defaultState,
      defaultAddress: product.seller.defaultAddress ?? "",
    },
  };
};

export const productsDAL = {

  getProducts: async (filter: ProductFilter): Promise<Product[]> => {
    try {
      const products = await productsRepository.getProducts(filter);
      return products.filter(p => p !== null).map((product) => mapProduct(product));
    } catch (error) {
      throw new Error("Failed to fetch products");
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const product = await productsRepository.getProductById(id);
      if (!product) {
        throw new Error("Product not found");
      }
      return mapProduct(product);
    } catch (error) {
      throw new Error("Failed to fetch product");
    }
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    try {
      const product = await productsRepository.getProductBySlug(slug);
      if (!product) {
        throw new Error("Product not found");
      }
      return mapProduct(product);
    } catch (error) {
      throw new Error("Failed to fetch product");
    }
  },

  getSimilarProducts: async (slug: string, count: number): Promise<Product[]> => {
    const products = await productsRepository.getSimilarProducts(slug, count);
    return products.filter(p => p !== null).map((product) => mapProduct(product));
  },

  getHeroProducts: async (limit: number): Promise<Product[]> => {
    const products = await productsRepository.getHeroProducts(limit);
    return products.filter(p => p !== null).map((product) => mapProduct(product));
  },

  getOfferProducts: async (limit: number): Promise<Product[]> => {
    const products = await productsRepository.getOfferProducts(limit);
    return products.filter(p => p !== null).map((product) => mapProduct(product));
  },
};