// hooks/checkout/useDisplayItems.ts

import { useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/domain/cart";
import type { Product } from "@/domain/product";

interface DisplayItemsReturn {
  displayItems: CartItem[];
  displaySubtotal: number;
  displayDiscount: number;
  displayTotal: number;
  isBuyNow: boolean;
  clearDisplayItems: () => Promise<void>;
}

export function useDisplayItems(
  buyNowProduct: Product | null
): DisplayItemsReturn {
  const cartItems = useCartStore((state) => state.items);
  const { subtotal, discount, total } = useCartStore((state) => state.totals);
  const clearCart = useCartStore((state) => state.clear);

  const isBuyNow = buyNowProduct !== null;

  let displayItems: CartItem[];
  let displaySubtotal: number;
  let displayDiscount: number;
  let displayTotal: number;

  if (isBuyNow && buyNowProduct) {
    // Convert Product to CartItem for Buy Now
    const buyNowItem: CartItem = {
      id: `buynow-${buyNowProduct.id}`,
      productId: buyNowProduct.id,
      productName: buyNowProduct.name,
      productSlug: buyNowProduct.slug,
      thumbnail: buyNowProduct.thumbnail,
      price: buyNowProduct.price,
      salePrice: buyNowProduct.salePrice,
      quantity: 1,
    };

    displayItems = [buyNowItem];
    displaySubtotal = buyNowItem.price;
    displayDiscount = buyNowItem.salePrice
      ? buyNowItem.price - buyNowItem.salePrice
      : 0;
    displayTotal = buyNowItem.salePrice ?? buyNowItem.price;
  } else {
    // Regular cart checkout
    displayItems = cartItems;
    displaySubtotal = subtotal;
    displayDiscount = discount;
    displayTotal = total;
  }

  const clearDisplayItems = async () => {
    if (!isBuyNow) {
      clearCart();
    }
    // For Buy Now, nothing to clear - it's just URL params
  };

  return {
    displayItems,
    displaySubtotal,
    displayDiscount,
    displayTotal,
    isBuyNow,
    clearDisplayItems,
  };
}