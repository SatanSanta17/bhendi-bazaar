/**
 * Server-side Category Repository
 *
 * This repository handles all database operations for categories.
 * Currently uses mock data, will be replaced with Prisma once schema is ready.
 */

import { categories } from "@/data/categories";
import type { ServerCategory } from "@/server/domain/category";

export class CategoryRepository {
  /**
   * List all categories sorted by order
   */
  async list(): Promise<ServerCategory[]> {
    return [...categories].sort((a, b) => a.order - b.order);
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<ServerCategory | null> {
    const category = categories.find((c) => c.slug === slug);
    return category ?? null;
  }
}

export const categoryRepository = new CategoryRepository();
