// components/checkout/GuestCheckoutForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/shared/forms/AddressFields";
import { useCheckoutPayment } from "./hooks/useCheckoutPayment";
import { useDisplayItems } from "./hooks/useDisplayItems";
import { ErrorState } from "@/components/shared/states/ErrorState";
import type { OrderAddress } from "@/domain/order";
import type { Product } from "@/domain/product";

type GuestCheckoutFormValues = OrderAddress & {
  notes?: string;
};

interface GuestCheckoutFormProps {
  buyNowProduct: Product | null;
}

export function GuestCheckoutForm({ buyNowProduct }: GuestCheckoutFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<GuestCheckoutFormValues>({
    defaultValues: {
      country: "India",
    },
  });

  const {
    displayItems,
    displaySubtotal,
    displayDiscount,
    displayTotal,
    isBuyNow,
  } = useDisplayItems(buyNowProduct);
  const { processPayment, error, setError } = useCheckoutPayment();
  // Helper function to strip +91 country code
  const stripCountryCode = (phone: string): string => {
    // Remove +91, +, spaces, and hyphens
    return phone.replace(/^\+91/, "").replace(/[\s\-+]/g, "");
  };
  const onSubmit = async (values: GuestCheckoutFormValues) => {
    if (!displayItems.length) return;

    setError(null);

    try {
      // Log the address object being sent
      const addressData = {
        fullName: values.fullName,
        mobile: values.mobile,
        email: values.email,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        state: values.state ?? "",
        pincode: values.pincode,
        country: values.country,
      };
      // Check stock availability
      const stockCheck = await fetch("/api/products/check-stock", {
        method: "POST",
        body: JSON.stringify({
          items: displayItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      }).then((r) => r.json());

      if (!stockCheck.available) {
        const messages = stockCheck.issues
          .map((i: any) => i.message)
          .join("\n");
        setError(
          `Some items are no longer available:\n\n${messages}\n\nPlease update your cart.`
        );
        return;
      }

      // Transform items: remove id field and handle salePrice
      const orderItems = displayItems.map((item) => {
        const { salePrice, ...rest } = item;
        return {
          ...rest,
          ...(typeof salePrice === "number" && { salePrice }), // Only add if number
        };
      });

      await processPayment({
        items: orderItems,
        totals: {
          subtotal: displaySubtotal,
          discount: displayDiscount,
          total: displayTotal,
        },
        address: addressData,
        notes: values.notes,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        isBuyNow,
      });
    } catch (error) {
      console.error("Guest checkout error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
      {error && <ErrorState message={error} retry={() => setError(null)} />}

      <AddressFields
        register={register}
        errors={errors}
        includeEmail
        includeNotes
      />

      <Button
        type="submit"
        disabled={!displayItems.length || isSubmitting}
        className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
      >
        {isSubmitting ? "Processing checkout..." : "Place order & pay"}
      </Button>
    </form>
  );
}