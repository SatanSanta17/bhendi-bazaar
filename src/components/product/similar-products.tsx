import { ProductCard } from "@/components/shared/product-card";
import type { Product } from "@/domain/product";

interface SimilarProductsProps {
  products: Product[];
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Similar
        </p>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Pieces from nearby lanes
        </h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}


