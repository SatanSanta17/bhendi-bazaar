// components/shared/button-groups/ProductActions.tsx

import { Button } from "@/components/ui/button";

interface ProductActionsProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  isOutOfStock: boolean;
  isAddingToCart?: boolean;
  isBuyingNow?: boolean;
}

export function ProductActions({
  onAddToCart,
  onBuyNow,
  isOutOfStock,
  isAddingToCart = false,
  isBuyingNow = false,
}: ProductActionsProps) {
  return (
    <div className="mt-4 flex gap-2">
      <Button
        className="flex-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        variant="outline"
        disabled={isAddingToCart || isOutOfStock}
        onClick={onAddToCart}
      >
        {isOutOfStock
          ? "Out of Stock"
          : isAddingToCart
          ? "Adding..."
          : "Add to cart"}
      </Button>
      <Button
        className="flex-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        disabled={isBuyingNow || isOutOfStock}
        onClick={onBuyNow}
      >
        {isOutOfStock
          ? "Unavailable"
          : isBuyingNow
          ? "Loading..."
          : "Buy Now"}
      </Button>
    </div>
  );
}