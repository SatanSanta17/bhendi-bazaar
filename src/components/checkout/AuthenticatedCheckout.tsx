// components/checkout/AuthenticatedCheckout.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddressModal } from "@/components/profile/address-modal";
import { AddressSelector } from "./AddressSelector";
import { useCheckoutPayment } from "./hooks/useCheckoutPayment";
import { useDisplayItems } from "./hooks/useDisplayItems";
import { ErrorState } from "@/components/shared/states/ErrorState";
import type { ProfileAddress } from "@/domain/profile";
import type { Product } from "@/domain/product";

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

  const handleCheckout = async () => {
    console.log("🔍 [DEBUG] selectedAddress:", selectedAddress);
    console.log("🔍 [DEBUG] displayItems:", displayItems);

    if (!selectedAddress || !displayItems.length) {
      console.error("❌ Guard check failed: no address or items");
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

      console.log("📦 [DEBUG] Address data being sent:", addressData);

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
          total: displayTotal,
        },
        address: { ...addressData, country: "India" },
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
        disabled={!displayItems.length || !selectedAddress || isProcessing}
        className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        size="lg"
      >
        {isProcessing ? "Processing..." : "Place Order & Pay"}
      </Button>

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