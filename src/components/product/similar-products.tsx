import { ProductCard } from "@/components/shared/product-card";
import type { Product } from "@/domain/product";
import { SectionHeader } from "../shared/SectionHeader";

interface SimilarProductsProps {
  products: Product[];
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader overline="Pieces from nearby lanes" title="Similar" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}


