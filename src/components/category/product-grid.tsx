import type { Product } from "@/domain/product";
import { ProductCard } from "@/components/shared/product-card";

interface CategoryProductGridProps {
  products: Product[];
}

export function CategoryProductGrid({ products }: CategoryProductGridProps) {
  if (!products.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No products found in this lane yet. Curation is on its way.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}


