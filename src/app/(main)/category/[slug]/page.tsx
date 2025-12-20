import { notFound } from "next/navigation";

import { CategoryHero } from "@/components/category/category-hero";
import { CategoryFilterBar } from "@/components/category/filter-bar";
import { CategoryProductGrid } from "@/components/category/product-grid";
import { categoryRepository } from "@/server/repositories/categoryRepository";
import { productRepository } from "@/server/repositories/productRepository";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { q } = await searchParams;
  const category = await categoryRepository.findBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = await productRepository.list({
    categorySlug: slug,
    search: q,
  });

  return (
    <div className="space-y-4">
      <CategoryHero category={category} />
      <CategoryFilterBar />
      <CategoryProductGrid products={products} />
    </div>
  );
}


