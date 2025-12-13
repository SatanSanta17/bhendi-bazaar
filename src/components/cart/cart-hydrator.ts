// src/components/cart/cart-hydrator.tsx
"use client";
import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function CartHydrator() {
  const rehydrate = useCartStore((s) => s.rehydrateFromStorage);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  return null;
}