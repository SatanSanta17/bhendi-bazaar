/**
 * Checkout with Shipping Integration
 * 
 * Enhanced checkout form that includes shipping method selection
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/shared/forms/AddressFields";
import { PincodeChecker } from "@/components/shipping/PincodeChecker";
import { ShippingMethodSelector } from "@/components/shipping/ShippingMethodSelector";
import { useCheckoutPayment } from "./hooks/useCheckoutPayment";
import { useDisplayItems } from "./hooks/useDisplayItems";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { calculateCartWeight } from "@/utils/shipping";
import type { OrderAddress } from "@/domain/order";
import type { Product } from "@/domain/product";
import type { ShippingRate } from "@/domain/shipping";

type GuestCheckoutFormValues = OrderAddress & {
  notes?: string;
};

interface GuestCheckoutFormWithShippingProps {
  buyNowProduct: Product | null;
}

export function GuestCheckoutFormWithShipping({ buyNowProduct }: GuestCheckoutFormWithShippingProps) {
  const {
    register,
    handleSubmit,
    watch,
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

  // Shipping state
  const [isServiceable, setIsServiceable] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingRate | null>(null);
  const [packageWeight, setPackageWeight] = useState(0);

  // Watch pincode field
  const pincode = watch("pincode");

  // Calculate package weight from cart items
  useEffect(() => {
    const weight = calculateCartWeight(displayItems);
    setPackageWeight(weight);
  }, [displayItems]);

  const handleServiceabilityChange = (serviceable: boolean) => {
    setIsServiceable(serviceable);
    if (!serviceable) {
      setSelectedShippingMethod(null);
    }
  };

  const handleShippingMethodSelect = (rate: ShippingRate | null) => {
    setSelectedShippingMethod(rate);
  };

  // Calculate final total including shipping
  const shippingCost = selectedShippingMethod?.rate || 0;
  const finalTotal = displayTotal + shippingCost;

  const onSubmit = async (values: GuestCheckoutFormValues) => {
    if (!displayItems.length) return;

    // Validate shipping selection
    if (!isServiceable) {
      setError("Please enter a serviceable pincode");
      return;
    }

    if (!selectedShippingMethod) {
      setError("Please select a shipping method");
      return;
    }

    setError(null);

    try {
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

      // Transform items
      const orderItems = displayItems.map((item) => {
        const { salePrice, ...rest } = item;
        return {
          ...rest,
          ...(typeof salePrice === "number" && { salePrice }),
        };
      });

      // Include shipping information in payment
      await processPayment({
        items: orderItems,
        totals: {
          subtotal: displaySubtotal,
          discount: displayDiscount,
          shipping: shippingCost,
          total: finalTotal,
        },
        address: addressData,
        shipping: {
          providerId: selectedShippingMethod.providerId,
          courierName: selectedShippingMethod.courierName,
          shippingCost: shippingCost,
          estimatedDays: selectedShippingMethod.estimatedDays,
          mode: selectedShippingMethod.mode,
          packageWeight: packageWeight,
        },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-sm">
      {error && <ErrorState message={error} retry={() => setError(null)} />}

      {/* Step 1: Address */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Delivery Address</h3>
        <AddressFields
          register={register}
          errors={errors}
          includeEmail
          includeNotes={false}
        />
      </div>

      {/* Step 2: Pincode Serviceability Check */}
      {pincode && pincode.length === 6 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Check Availability</h3>
          <PincodeChecker
            pincode={pincode}
            onServiceabilityChange={handleServiceabilityChange}
            autoCheck={true}
          />
        </div>
      )}

      {/* Step 3: Shipping Method Selection */}
      {isServiceable && pincode && (
        <div className="space-y-4">
          <ShippingMethodSelector
            pincode={pincode}
            weight={packageWeight}
            onMethodSelect={handleShippingMethodSelect}
            autoFetch={true}
          />
        </div>
      )}

      {/* Order Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Order Notes (Optional)
        </label>
        <textarea
          {...register("notes")}
          placeholder="Any special instructions for delivery?"
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Place Order Button */}
      <Button
        type="submit"
        disabled={!displayItems.length || !selectedShippingMethod || isSubmitting}
        className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
      >
        {isSubmitting ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)}`}
      </Button>

      {!isServiceable && pincode?.length === 6 && (
        <p className="text-xs text-amber-600 text-center">
          Please check if delivery is available to your pincode
        </p>
      )}

      {isServiceable && !selectedShippingMethod && (
        <p className="text-xs text-amber-600 text-center">
          Please select a shipping method to continue
        </p>
      )}
    </form>
  );
}

