import type { Category, CategoryRepository } from "@/domain/category";
import { categories } from "@/data/categories";

class InMemoryCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    return [...categories].sort((a, b) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    return categories.find((c) => c.slug === slug);
  }
}

const repository = new InMemoryCategoryRepository();

export const categoryService = {
  list: () => repository.list(),
  findBySlug: (slug: string) => repository.findBySlug(slug),
};


