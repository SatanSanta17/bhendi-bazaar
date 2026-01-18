// src/components/checkout/checkoutContainer/index.tsx
"use client";
import { productService } from "@/services/productService";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";
import { CheckoutAddress } from "./components/checkout-address";
import { CheckoutSummary } from "./components/checkout-summary";
import { uuidv4 } from "zod";
import { useSearchParams } from "next/navigation";
import { CheckoutItem } from "./types";
import { useCheckout } from "./hooks/useCheckout";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { Package } from "lucide-react";
import { EmptyState } from "../shared/states/EmptyState";
import { useProfileContext } from "@/context/ProfileContext";
import { useShippingRates } from "@/hooks/shipping/useShippingRates";
import { ShippingRatesSection } from "./components/ShippingRatesSection";
import { calculateCartWeight } from "@/utils/shipping";

export function CheckoutContainer() {
  const searchParams = useSearchParams();
  const buyNowSlug = searchParams.get("buyNow");

  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);

  const [loading, setLoading] = useState(!!buyNowSlug);
  const [error, setError] = useState<string | null>(null);

  const isBuyNow = !!buyNowSlug;

  const checkout = useCheckout({ items: checkoutItems, isBuyNow });

  const {
    serviceable,
    rates,
    selectedRate,
    loading: shippingLoading,
    error: shippingError,
    selectRate,
    fetchRates,
  } = useShippingRates();

  useEffect(() => {
    if (checkout.selectedAddress) {
      fetchRates({
        fromPincode: checkout.selectedAddress.pincode,
        toPincode: checkout.selectedAddress.pincode,
        weight: calculateCartWeight(checkoutItems),
        cod: false,
      });
    }
  }, [checkout.selectedAddress]);

  const { profile, updateAddresses } = useProfileContext(); // ✅ Changed from useProfile

  useEffect(() => {
    const loadItems = async () => {
      if (buyNowSlug) {
        try {
          setLoading(true);
          const product = await productService.getProductBySlug(buyNowSlug);

          if (product) {
            setCheckoutItems([
              {
                id: uuidv4().toString(),
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                thumbnail: product.thumbnail,
                price: product.price,
                salePrice: product.salePrice,
                quantity: 1,
              },
            ]);
          } else {
            setError("Product not found");
          }
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setCheckoutItems(useCartStore.getState().items);
        setLoading(false);
      }
    };
    loadItems();
  }, [buyNowSlug]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  if (checkoutItems.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No items to checkout"
        description="Add items to your cart to checkout"
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {/* Address Form */}
        <CheckoutAddress
          selectedAddress={checkout.selectedAddress}
          onAddressChange={checkout.setAddress}
          onAddressUpdated={updateAddresses}
          addresses={profile?.addresses || []}
        />

        {/* Shipping Rates (conditional) */}
        {serviceable && rates.length > 0 && (
          <ShippingRatesSection
            rates={rates}
            selectedRate={selectedRate}
            onRateSelect={selectRate}
            loading={shippingLoading}
            error={shippingError}
            serviceable={serviceable}
          />
        )}

        {/* Checkout Actions */}
        {/* <CheckoutActions
          canCheckout={checkout.canCheckout}
          isProcessing={checkout.isProcessing}
          total={checkout.totals.total}
        //   onCheckout={checkout.processCheckout}
          validationErrors={checkout.validationErrors}
          error={checkout.error}
        /> */}
      </div>
      <CheckoutSummary
        items={checkoutItems}
        subtotal={checkout.totals.subtotal}
        discount={checkout.totals.discount}
        total={checkout.totals.total}
      />
    </div>
  );
}
