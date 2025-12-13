import type { Product } from "@/domain/product";

interface ReviewsProps {
  product: Product;
}

export function Reviews({ product }: ReviewsProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Reviews
          </p>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Bazaar whispers
          </h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {product.rating.toFixed(1)} · {product.reviewsCount} reviews
        </div>
      </header>
      <p className="text-xs text-muted-foreground">
        Detailed customer reviews will appear here once we connect the backend.
        For now, ratings hint at how well this piece is loved.
      </p>
    </section>
  );
}


