// components/checkout/AuthenticatedCheckout.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddressModal } from "@/components/profile/address-modal";
import { AddressSelector } from "./AddressSelector";
import { PincodeChecker } from "@/components/shipping/PincodeChecker";
import { ShippingMethodSelector } from "@/components/shipping/ShippingMethodSelector";
import { useCheckoutPayment } from "./hooks/useCheckoutPayment";
import { useDisplayItems } from "./hooks/useDisplayItems";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { calculateCartWeight } from "@/utils/shipping";
import type { ProfileAddress } from "@/domain/profile";
import type { Product } from "@/domain/product";
import type { ShippingRate } from "@/domain/shipping";

interface AuthenticatedCheckoutProps {
  buyNowProduct: Product | null;
}

export function AuthenticatedCheckout({
  buyNowProduct,
}: AuthenticatedCheckoutProps) {
  const { data: session } = useSession();
  const { profile, user, updateAddresses } = useProfile(!!session?.user);
  const {
    displayItems,
    displaySubtotal,
    displayDiscount,
    displayTotal,
    isBuyNow,
  } = useDisplayItems(buyNowProduct);
  const { processPayment, isProcessing, error, setError } =
    useCheckoutPayment();

  const [selectedAddress, setSelectedAddress] = useState<ProfileAddress | null>(
    null
  );
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  
  // Shipping state
  const [isServiceable, setIsServiceable] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingRate | null>(null);
  const [packageWeight, setPackageWeight] = useState(0);

  // Helper function to strip +91 country code
  const stripCountryCode = (phone: string): string => {
    // Remove +91, +, spaces, and hyphens
    return phone.replace(/^\+91/, "").replace(/[\s\-+]/g, "");
  };

  // Auto-select default address
  useEffect(() => {
    if (profile?.addresses?.length) {
      const defaultAddress =
        profile.addresses.find((addr) => addr.isDefault) ||
        profile.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [profile]);

  // Calculate package weight from cart items
  useEffect(() => {
    const weight = calculateCartWeight(displayItems);
    setPackageWeight(weight);
  }, [displayItems]);

  const handleSaveNewAddress = async (address: ProfileAddress) => {
    if (!profile) return;

    const isFirstAddress = !profile.addresses?.length;
    const newAddress = {
      ...address,
      isDefault: isFirstAddress,
    };

    await updateAddresses([...(profile?.addresses || []), newAddress]);
    setSelectedAddress(newAddress);
    setShowAddressModal(false);
  };

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

  const handleCheckout = async () => {
    if (!selectedAddress || !displayItems.length) {
      return;
    }

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
      // Log the address object being sent
      const addressData = {
        fullName: selectedAddress.fullName,
        mobile: stripCountryCode(selectedAddress.mobile),
        email: user?.email || "",
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        city: selectedAddress.city,
        state: selectedAddress.state ?? "",
        pincode: selectedAddress.pincode,
        country: selectedAddress.country,
      };

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

      await processPayment({
        items: displayItems,
        totals: {
          subtotal: displaySubtotal,
          discount: displayDiscount,
          shipping: shippingCost,
          total: finalTotal,
        },
        address: { ...addressData, country: "India" },
        shipping: {
          providerId: selectedShippingMethod.providerId,
          courierName: selectedShippingMethod.courierName,
          shippingCost: shippingCost,
          estimatedDays: selectedShippingMethod.estimatedDays,
          mode: selectedShippingMethod.mode,
          packageWeight: packageWeight,
        },
        notes: orderNotes,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        isBuyNow,
      });
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const hasAddresses = !!profile?.addresses?.length;

  return (
    <div className="space-y-6">
      {error && <ErrorState message={error} retry={() => setError(null)} />}

      {/* Address Selection */}
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Address
        </label>
        <AddressSelector
          selectedAddress={selectedAddress}
          addresses={profile?.addresses || []}
          isOpen={showAddressSelector}
          onToggle={() => setShowAddressSelector(!showAddressSelector)}
          onSelect={setSelectedAddress}
          onAddNew={() => setShowAddressModal(true)}
        />
      </div>

      {/* Pincode Serviceability Check */}
      {selectedAddress && selectedAddress.pincode && (
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Check Availability
          </label>
          <PincodeChecker
            pincode={selectedAddress.pincode}
            onServiceabilityChange={handleServiceabilityChange}
            autoCheck={true}
          />
        </div>
      )}

      {/* Shipping Method Selection */}
      {isServiceable && selectedAddress && (
        <div className="space-y-3">
          <ShippingMethodSelector
            pincode={selectedAddress.pincode}
            weight={packageWeight}
            onMethodSelect={handleShippingMethodSelect}
            autoFetch={true}
          />
        </div>
      )}

      {/* Order Notes */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Notes for the Bazaar (Optional)
        </label>
        <Textarea
          rows={3}
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Any special instructions for delivery..."
          className="resize-none"
        />
      </div>

      {/* Place Order Button */}
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={!displayItems.length || !selectedAddress || !selectedShippingMethod || isProcessing}
        className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        size="lg"
      >
        {isProcessing ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)}`}
      </Button>

      {!isServiceable && selectedAddress?.pincode && (
        <p className="text-xs text-amber-600 text-center">
          Please check if delivery is available to your pincode
        </p>
      )}

      {isServiceable && !selectedShippingMethod && (
        <p className="text-xs text-amber-600 text-center">
          Please select a shipping method to continue
        </p>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          mode="add"
          address={{
            id: crypto.randomUUID(),
            label: "",
            fullName: user?.name || "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
            mobile: user?.mobile || "",
            isDefault: !hasAddresses,
          }}
          saving={false}
          onClose={() => setShowAddressModal(false)}
          onSave={handleSaveNewAddress}
          onStartEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
}