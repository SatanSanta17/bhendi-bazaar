 "use client";

import type { Product } from "@/domain/product";
import { useTransition } from "react";
import { toast } from "sonner";
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
  const items = useCartStore((state) => state.items);
  const setBuyNowItem = useCartStore((state) => state.setBuyNowItem);
  const [isPending, startTransition] = useTransition();
  const [isBuyNowPending, startBuyNowTransition] = useTransition();
  const router = useRouter();
  const hasOffer = Boolean(
    product.salePrice && product.salePrice < product.price
  );
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  // Get current quantity in cart for this product
  const currentCartQty =
    items.find((item) => item.productId === product.id)?.quantity || 0;
  const remainingStock = product.stock - currentCartQty;

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    if (currentCartQty >= product.stock) {
      toast.error(
        `You already have ${currentCartQty} in your cart (maximum available)`
      );
      return;
    }

    const item = {
      productId: product.id,
      name: product.name,
      thumbnail: product.thumbnail,
      price: product.price,
      salePrice: product.salePrice,
      quantity: 1,
    };

    setBuyNowItem(item);

    // Add a small delay to ensure state is set before navigation
    setTimeout(() => {
      startBuyNowTransition(() => {
        router.push("/checkout");
      });
    }, 50);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    // Check if adding 1 more exceeds stock
    if (currentCartQty + 1 > product.stock) {
      toast.error(
        `Cannot add more. Maximum ${product.stock} available (${currentCartQty} already in cart)`
      );
      return;
    }

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
            toast.success("Added to cart");
            resolve(undefined);
          }, 300);
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

      {/* Stock Status */}
      <div className="space-y-1">
        {isOutOfStock ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
            <span className="font-medium text-red-600">Out of Stock</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isLowStock ? "bg-orange-500" : "bg-green-500"
                }`}
              ></span>
              <span
                className={`font-medium ${
                  isLowStock ? "text-orange-600" : "text-green-600"
                }`}
              >
                {isLowStock
                  ? `Only ${product.stock} left in stock!`
                  : "In Stock"}
              </span>
            </div>
            {currentCartQty > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentCartQty} in cart • {remainingStock} more available
              </p>
            )}
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
          disabled={isPending || isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock
            ? "Out of Stock"
            : isPending
            ? "Adding..."
            : "Add to cart"}
        </Button>
        <Button
          className="cursor-pointer flex-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
          disabled={isBuyNowPending || isOutOfStock}
          onClick={handleBuyNow}
        >
          {isOutOfStock
            ? "Unavailable"
            : isBuyNowPending
            ? "Loading..."
            : "Buy Now"}
        </Button>
      </div>
    </section>
  );
}
