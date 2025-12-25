// hooks/checkout/useDisplayItems.ts

import { useCartStore } from "@/store/cartStore";
import type { CartItem, CartTotals } from "@/domain/cart";

interface DisplayItemsReturn {
  displayItems: CartItem[];
  displaySubtotal: number;
  displayDiscount: number;
  displayTotal: number;
  clearDisplayItems: () => Promise<void>;
}

export function useDisplayItems(): DisplayItemsReturn {
  const items = useCartStore((state) => state.items);
  const buyNowItem = useCartStore((state) => state.buyNowItem);
  const subtotal = useCartStore((state) => state.subtotal);
  const discount = useCartStore((state) => state.discount);
  const total = useCartStore((state) => state.total);
  const clearBuyNow = useCartStore((state) => state.clearBuyNow);
  const clear = useCartStore((state) => state.clear);

  // Compute display values based on buyNow vs regular cart
  const displayItems = buyNowItem ? [buyNowItem] : items;
  const displaySubtotal = buyNowItem
    ? buyNowItem.price * buyNowItem.quantity
    : subtotal;
  const displayDiscount =
    buyNowItem && buyNowItem.salePrice
      ? (buyNowItem.price - buyNowItem.salePrice) * buyNowItem.quantity
      : discount;
  const displayTotal = buyNowItem
    ? (buyNowItem.salePrice ?? buyNowItem.price) * buyNowItem.quantity
    : total;

  const clearDisplayItems = async () => {
    if (buyNowItem) {
      clearBuyNow();
    } else {
      clear();
    }
  };

  return {
    displayItems,
    displaySubtotal,
    displayDiscount,
    displayTotal,
    clearDisplayItems,
  };
}