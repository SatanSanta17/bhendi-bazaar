// components/shared/PriceDisplay.tsx

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OfferBadge } from "./badges/StatusBadge";

interface PriceDisplayProps {
  price: number;
  salePrice?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  salePrice,
  currency = "INR",
  size = "md",
  showBadge = true,
  className,
}: PriceDisplayProps) {
  const hasOffer = salePrice != null && salePrice > 0 && salePrice < price;
  const displayPrice = hasOffer ? salePrice : price;

  const sizeClasses = {
    sm: { price: "text-sm", original: "text-xs" },
    md: { price: "text-xl", original: "text-sm" },
    lg: { price: "text-2xl", original: "text-base" },
  };

  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span className={cn("font-semibold text-primary", sizeClasses[size].price)}>
        {formatCurrency(displayPrice)}
      </span>
      {hasOffer && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through",
              sizeClasses[size].original
            )}
          >
            {formatCurrency(price)}
          </span>
          {showBadge && <OfferBadge />}
        </>
      )}
    </div>
  );
}