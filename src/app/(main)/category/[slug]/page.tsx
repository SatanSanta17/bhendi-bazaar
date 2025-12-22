"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CategoryHero } from "@/components/category/category-hero";
import { CategoryProductGrid } from "@/components/category/product-grid";
import { categoryService } from "@/services/categoryService"; // Client service
import { productService } from "@/services/productService";
import type { Category } from "@/domain/category";
import type { Product } from "@/domain/product";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { slug } = await params;
      const { q } = await searchParams;

      try {
        const [categoryData, productsData] = await Promise.all([
          categoryService.getCategoryBySlug(slug),
          productService.getProducts({ categorySlug: slug, search: q }),
        ]);

        if (!categoryData) {
          notFound();
        }

        setCategory(categoryData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load category:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <CategoryHero category={category} />
      <CategoryProductGrid products={products} />
    </div>
  );
}
