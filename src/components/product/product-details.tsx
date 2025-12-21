 "use client";

import type { Product } from "@/domain/product";
import { useTransition } from "react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const addItem = useCartStore((state) => state.addItem);
  const setBuyNowItem = useCartStore((state) => state.setBuyNowItem);
  const [isPending, startTransition] = useTransition();
  const [isBuyNowPending, startBuyNowTransition] = useTransition();
  const router = useRouter();
  const hasOffer = Boolean(
    product.salePrice && product.salePrice < product.price
  );

  const handleBuyNow = () => {
    const item = {
      productId: product.id,
      name: product.name,
      thumbnail: product.thumbnail,
      price: product.price,
      salePrice: product.salePrice,
      quantity: 1,
    };
    console.log("Setting buyNowItem:", item);

    setBuyNowItem(item);

    // Add a small delay to ensure state is set before navigation
    setTimeout(() => {
      console.log("Navigating to checkout");
      startBuyNowTransition(() => {
        router.push("/checkout");
      });
    }, 50);
  };

  const handleAddToCart = () => {
    startTransition(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            addItem({
              productId: product.id,
              name: product.name,
              thumbnail: product.thumbnail,
              price: product.price,
              salePrice: product.salePrice,
              quantity: 1,
            });
            resolve(undefined);
          }, 1000);
        })
    );
  };

  return (
    <section className="space-y-4">
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

      <div className="flex items-baseline gap-3">
        <span className="text-xl font-semibold text-primary">
          {formatCurrency(product.salePrice ?? product.price)}
        </span>
        {hasOffer && (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </span>
            <Badge className="bg-emerald-100 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">
              Offer
            </Badge>
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{product.description}</p>

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
      <div className="mt-4 flex gap-2">
        <Button
          className="cursor-pointer flex-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
          variant="outline"
          disabled={isPending}
          onClick={handleAddToCart}
        >
          {isPending ? "Adding..." : "Add to cart"}
        </Button>
        <Button
          className="cursor-pointer flex-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
          disabled={isBuyNowPending}
          onClick={handleBuyNow}
        >
          {isBuyNowPending ? "Loading..." : "Buy Now"}
        </Button>
      </div>
    </section>
  );
}
