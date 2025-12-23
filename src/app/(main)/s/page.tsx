"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/domain/product";
import { productService } from "@/services/productService";
import { CategoryProductGrid } from "@/components/category/product-grid";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const results = await productService.getProducts({ search: query });
        setProducts(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  if (!query) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Search the Bazaar</h1>
        <p className="text-muted-foreground">
          Enter a search term to find products
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Searching..." : `${products.length} products found`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Loading skeletons */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <CategoryProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No products found for "{query}"
          </p>
          <p className="text-sm">Try different keywords or browse categories</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}