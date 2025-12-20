import type { Category, CategoryRepository } from "@/domain/category";
import { categories } from "@/data/categories";

const USE_MOCK = true;

class InMemoryCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    return [...categories].sort((a, b) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    return categories.find((c) => c.slug === slug);
  }
}

class PrismaCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    // TODO: Implement with Prisma
    return [];
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    // TODO: Implement with Prisma
    return undefined;
  }
}

export const categoryRepository = USE_MOCK
  ? new InMemoryCategoryRepository()
  : new PrismaCategoryRepository();