import { productService } from "@/services/productService";
import { ProductCard } from "@/components/shared/product-card";

export async function HeroProductsGrid() {
  const heroes = await productService.heroProducts();

  if (!heroes.length) return null;

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Hero Pieces
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Curated from the lanes
          </h2>
        </div>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {heroes.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}


