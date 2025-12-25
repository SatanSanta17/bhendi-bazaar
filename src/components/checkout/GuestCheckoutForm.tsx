// components/checkout/GuestCheckoutForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/shared/forms/AddressFields";
import { FormTextarea } from "@/components/shared/forms/FormField";
import { useCheckoutPayment } from "./hooks/useCheckoutPayment";
import { useDisplayItems } from "./hooks/useDisplayItems";
import { ErrorState } from "@/components/shared/states/ErrorState";
import type { OrderAddress } from "@/domain/order";

type GuestCheckoutFormValues = OrderAddress & {
  notes?: string;
};

export function GuestCheckoutForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<GuestCheckoutFormValues>({
    defaultValues: {
      country: "India",
    },
  });

  const { displayItems, displaySubtotal, displayDiscount, displayTotal } =
    useDisplayItems();
  const { processPayment, error, setError } = useCheckoutPayment();

  const onSubmit = async (values: GuestCheckoutFormValues) => {
    if (!displayItems.length) return;

    setError(null);

    try {
      // Check stock availability
      const checkStockAvailability = useCartStore.getState()
        .checkStockAvailability;
      const stockCheck = await checkStockAvailability();

      if (!stockCheck.available) {
        const messages = stockCheck.issues.map((i) => i.message).join("\n");
        setError(
          `Some items are no longer available:\n\n${messages}\n\nPlease update your cart.`
        );
        return;
      }

      await processPayment({
        items: displayItems,
        totals: {
          subtotal: displaySubtotal,
          discount: displayDiscount,
          total: displayTotal,
        },
        address: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
          line1: values.line1,
          line2: values.line2,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
        },
        notes: values.notes,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
      });
    } catch (error) {
      console.error("Guest checkout error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
      {error && (
        <ErrorState
          message={error}
          retry={() => setError(null)}
        />
      )}

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