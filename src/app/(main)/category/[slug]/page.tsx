import { notFound } from "next/navigation";

import { CategoryHero } from "@/components/category/category-hero";
import { CategoryFilterBar } from "@/components/category/filter-bar";
import { CategoryProductGrid } from "@/components/category/product-grid";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";

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
  const category = await categoryService.findBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = await productService.list({
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


