"use client";

import { useSession } from "next-auth/react";
import { GuestCheckoutFormWithShipping } from "./GuestCheckoutFormWithShipping";
import { AuthenticatedCheckout } from "./AuthenticatedCheckout";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";
import type { Product } from "@/domain/product";

interface CheckoutFormProps {
  buyNowProduct: Product | null;
}

export function CheckoutForm({ buyNowProduct }: CheckoutFormProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return session?.user ? (
    <AuthenticatedCheckout buyNowProduct={buyNowProduct} />
  ) : (
    <GuestCheckoutFormWithShipping buyNowProduct={buyNowProduct} />
  );
}
