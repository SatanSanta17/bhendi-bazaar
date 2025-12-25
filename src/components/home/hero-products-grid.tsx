// NEW VERSION - hero-products-grid.tsx

"use client";

import { productService } from "@/services/productService";
import { ProductCard } from "@/components/shared/product-card";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";
import { EmptyState } from "@/components/shared/states/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useAsyncData } from "@/hooks/core/useAsyncData";
import { Package } from "lucide-react";

export function HeroProductsGrid() {
  const {
    data: heroes,
    loading,
    error,
  } = useAsyncData(() => productService.getFeaturedProducts(6));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Package}
        title="Failed to load products"
        description={error}
      />
    );
  }

  if (!heroes?.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeader overline="Hero Pieces" title="Curated from the lanes" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {heroes.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
