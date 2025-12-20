import type {
  Product,
  ProductFilter,
  ProductRepository,
} from "@/domain/product";
import { products } from "@/data/products";

const USE_MOCK = true;

class InMemoryProductRepository implements ProductRepository {
  async list(filter?: ProductFilter): Promise<Product[]> {
    let result = [...products];

    if (filter?.categorySlug) {
      result = result.filter((p) => p.categorySlug === filter.categorySlug);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filter?.offerOnly) {
      result = result.filter((p) => Boolean(p.isOnOffer || p.salePrice));
    }

    if (filter?.featuredOnly) {
      result = result.filter((p) => Boolean(p.isFeatured));
    }

    if (filter?.minPrice != null) {
      result = result.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice != null) {
      result = result.filter((p) => p.price <= filter.maxPrice!);
    }

    return result;
  }

  async findBySlug(slug: string): Promise<Product | undefined> {
    return products.find((p) => p.slug === slug);
  }

  async findSimilar(slug: string, limit = 4): Promise<Product[]> {
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];

    return products
      .filter(
        (p) =>
          p.slug !== slug &&
          (p.categorySlug === product.categorySlug ||
            p.tags.some((t) => product.tags.includes(t)))
      )
      .slice(0, limit);
  }

  async heroProducts(): Promise<Product[]> {
    return products.filter((p) => p.isHero || p.isFeatured).slice(0, 6);
  }

  async offerProducts(): Promise<Product[]> {
    return products.filter((p) => p.isOnOffer || p.salePrice);
  }
}

class PrismaProductRepository implements ProductRepository {
  async list(filter?: ProductFilter): Promise<Product[]> {
    let result: Product[] = [];

    if (filter?.categorySlug) {
      result = result.filter((p) => p.categorySlug === filter.categorySlug);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filter?.offerOnly) {
      result = result.filter((p) => Boolean(p.isOnOffer || p.salePrice));
    }

    if (filter?.featuredOnly) {
      result = result.filter((p) => Boolean(p.isFeatured));
    }

    if (filter?.minPrice != null) {
      result = result.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice != null) {
      result = result.filter((p) => p.price <= filter.maxPrice!);
    }

    return result;
  }
  async findBySlug(slug: string): Promise<Product | undefined> {
    return undefined;
  }
  async findSimilar(slug: string, limit?: number): Promise<Product[]> {
    return [];
  }
  async heroProducts(): Promise<Product[]> {
    return [];
  }
  async offerProducts(): Promise<Product[]> {
    return [];
  }
}

export const productRepository = USE_MOCK
  ? new InMemoryProductRepository()
  : new PrismaProductRepository();
