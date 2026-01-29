import { ProductCard } from "@/components/shared/product-card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { productsDAL } from "@/data-access-layer/products.dal";
import { Suspense } from "react";
import { ProductGridSkeleton } from "../shared/states/LoadingSkeleton";

export async function HeroProductsGrid() {
  const heroes = await productsDAL.getHeroProducts(6);

  return (
    <section className="space-y-4">
      <SectionHeader overline="Hero Pieces" title="Curated from the lanes" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </Suspense>
    </section>
  );
}
