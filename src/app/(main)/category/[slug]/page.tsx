"use client";

import { useAsyncData } from "@/hooks/core/useAsyncData";
import { useEffect, useState } from "react";
import { CategoryHero } from "@/components/category/category-hero";
import { CategoryProductGrid } from "@/components/category/product-grid";
import { categoryService } from "@/services/categoryService"; // Client service
import { productService } from "@/services/productService";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { EmptyState } from "@/components/shared/states/EmptyState";
import { Package } from "lucide-react";
import { ErrorState } from "@/components/shared/states/ErrorState";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    params.then(({ slug }) => setSlug(slug));
  }, [params]);

  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const [category, products] = await Promise.all([
        categoryService.getCategoryBySlug(slug),
        productService.getProducts({ categorySlug: slug }),
      ]);
      return { category, products };
    },
    { enabled: !!slug }
  );

  const category = data?.category;
  const products = data?.products;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} retry={refetch} />;
  }

  return (
    <div className="space-y-4">
      {category && products ? (
        <>
          <CategoryHero category={category} />
          <CategoryProductGrid products={products} />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title="No category or products found"
          description="Try different keywords or browse categories"
        />
      )}
    </div>
  );
}
