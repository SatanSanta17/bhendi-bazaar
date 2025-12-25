// REFACTORED: checkout-form.tsx (orchestrator only)

"use client";

import { useSession } from "next-auth/react";
import { GuestCheckoutForm } from "./GuestCheckoutForm";
import { AuthenticatedCheckout } from "./AuthenticatedCheckout";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";

export function CheckoutForm() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return session?.user ? <AuthenticatedCheckout /> : <GuestCheckoutForm />;
}
