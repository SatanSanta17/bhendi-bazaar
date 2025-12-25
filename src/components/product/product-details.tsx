// NEW VERSION - product-details.tsx

"use client";

import type { Product } from "@/domain/product";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { StockStatus } from "@/components/shared/StockStatus";
import { ProductActions } from "@/components/shared/button-groups/ProductActions";
import { useProductActions } from "@/hooks/product/useProductActions";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const {
    handleAddToCart,
    handleBuyNow,
    isAddingToCart,
    isBuyingNow,
    isOutOfStock,
    currentCartQty,
    remainingStock,
  } = useProductActions(product);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Bhendi Bazaar · {product.categorySlug.replace("-", " ")}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {product.rating.toFixed(1)} · {product.reviewsCount} reviews
          </span>
        </div>
      </div>

      {/* Price - Using PriceDisplay component */}
      <PriceDisplay
        price={product.price}
        salePrice={product.salePrice}
        size="lg"
      />

      {/* Stock Status - Using StockStatus component */}
      <StockStatus
        stock={product.stock}
        lowStockThreshold={product.lowStockThreshold}
        cartQuantity={currentCartQty}
      />

      {/* Description */}
      <p className="text-sm text-muted-foreground">{product.description}</p>

      {/* Sizes (if available) */}
      {product.options?.sizes && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sizes
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {product.options.sizes.map((size) => (
              <span
                key={size}
                className="rounded-full border border-border/80 px-3 py-1 uppercase tracking-[0.18em]"
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions - Using ProductActions component */}
      <ProductActions
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isOutOfStock={isOutOfStock}
        isAddingToCart={isAddingToCart}
        isBuyingNow={isBuyingNow}
      />
    </section>
  );
}
