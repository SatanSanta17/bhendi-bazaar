/**
 * Server-side Category Repository
 *
 * This repository handles all database operations for categories.
 */

import { prisma } from "@/lib/prisma";
import type { ServerCategory } from "../domain/category";

export class CategoryRepository {
  /**
   * List all categories sorted by order
   */
  async list(): Promise<ServerCategory[]> {
    const categories = await prisma.category.findMany({
      orderBy: [
        {
          order: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
    return categories;
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<ServerCategory | null> {
    const category = await prisma.category.findUnique({
      where: { slug },
    });
    return category;
  }
}

export const categoryRepository = new CategoryRepository();