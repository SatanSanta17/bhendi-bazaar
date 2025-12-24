"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface CartItemWithStock {
  id: string;
  productId: string;
  name: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  stock?: number;
  isLoading?: boolean;
}

function CartItem({ item }: { item: CartItemWithStock }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateQuantityWithLimit = useCartStore(
    (state) => state.updateQuantityWithLimit
  );
  const removeItem = useCartStore((state) => state.removeItem);
  const [stock, setStock] = useState<number | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(true);

  useEffect(() => {
    // Fetch stock from bulk check API
    fetch("/api/products/check-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: item.productId, quantity: item.quantity }],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items[0]) {
          setStock(data.items[0].stock);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stock:", err);
      })
      .finally(() => {
        setIsLoadingStock(false);
      });
  }, [item.productId]);

  const handleIncrease = () => {
    if (stock === null) {
      updateQuantity(item.id, item.quantity + 1);
      return;
    }

    if (item.quantity + 1 > stock) {
      toast.error(`Only ${stock} available in stock`);
      return;
    }

    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity - 1 === 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const isAtMaxStock = stock !== null && item.quantity >= stock;
  const showStockWarning =
    stock !== null && stock < 10 && item.quantity < stock;

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3 text-sm">
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
          {item.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.size && <span>Size {item.size}</span>}
          {item.color && <span>· {item.color}</span>}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm font-semibold">
            {formatCurrency(item.salePrice ?? item.price)}
          </span>
          {item.salePrice && item.salePrice < item.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(item.price)}
            </span>
          )}
        </div>
        {/* Stock Status */}
        {!isLoadingStock && stock !== null && (
          <div className="pt-1">
            {stock === 0 ? (
              <p className="text-xs text-red-600 font-medium">Out of stock</p>
            ) : showStockWarning ? (
              <p className="text-xs text-orange-600">
                Only {stock} available
              </p>
            ) : isAtMaxStock ? (
              <p className="text-xs text-orange-600">
                Maximum quantity in cart
              </p>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center rounded-full border border-border/70 bg-background px-2 py-1 text-xs">
          <button
            type="button"
            className="px-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            onClick={handleDecrease}
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-xs font-medium">
            {item.quantity}
          </span>
          <button
            type="button"
            className="px-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            onClick={handleIncrease}
            disabled={isAtMaxStock || stock === 0}
            title={
              isAtMaxStock
                ? "Maximum stock reached"
                : stock === 0
                ? "Out of stock"
                : undefined
            }
          >
            +
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          ×
        </Button>
      </div>
    </div>
  );
}

export function CartLineItems() {
  const items = useCartStore((state) => state.items);

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Your cart is quiet right now. Start with an emerald abaya or a scented
        attar from the Home page.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <CartItem key={item.id} item={item} />
      ))}
    </div>
  );
}


