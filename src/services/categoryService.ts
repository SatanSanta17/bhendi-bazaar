// src/services/categoryService.ts
import type { Category } from "@/domain/category";

class CategoryService {
  private baseUrl = "/api/categories";

  async getCategories(): Promise<Category[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const response = await fetch(`${this.baseUrl}/${slug}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch category");
    return response.json();
  }
}

export const categoryService = new CategoryService();