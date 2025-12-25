"use client";

import { useAsyncData } from "@/hooks/core/useAsyncData";
import { useSearchParams } from "next/navigation";
import { productService } from "@/services/productService";
import { CategoryProductGrid } from "@/components/category/product-grid";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/shared/states/EmptyState";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const {
    data: products,
    loading,
    error,
    refetch,
  } = useAsyncData(() => productService.getProducts({ search: query }));

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} retry={refetch} />;
  }

  if (!query) {
    return (
      <EmptyState
        icon={Package}
        title="No search results"
        description="Try different keywords or browse categories"
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionHeader
        overline="Search Results"
        title={`Search Results for "${query}"`}
      />

      {products && products.length > 0 ? (
        <CategoryProductGrid products={products} />
      ) : (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Try different keywords or browse categories"
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SearchContent />
    </Suspense>
  );
};