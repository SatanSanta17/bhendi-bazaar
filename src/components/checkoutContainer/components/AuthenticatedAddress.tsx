"use client";

import { useState, useEffect } from "react";
import { AddressModal } from "@/components/profile/address-modal";
import { AddressSelector } from "./AddressSelector";
import { DeliveryAddress } from "../types";
import { ProfileAddress } from "@/domain/profile";

interface AuthenticatedAddressProps {
  selectedAddress: DeliveryAddress | null;
  onAddressChange: (address: DeliveryAddress) => void;
  onAddressUpdated: (address: ProfileAddress) => void;
  addresses: ProfileAddress[];
}

export function AuthenticatedAddress({
  selectedAddress,
  onAddressChange,
  onAddressUpdated,
  addresses,
}: AuthenticatedAddressProps) {
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // ✅ Auto-select default address on mount
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      onAddressChange(defaultAddress);
    }
  }, [addresses, selectedAddress, onAddressChange]);

  const handleSaveNewAddress = async (address: ProfileAddress) => {
    // If first address make it default
    if (addresses.length === 0) {
      address.isDefault = true;
    }

    onAddressUpdated(address);
    onAddressChange(address);
    setShowAddressModal(false);
  };

  // Get default user info for modal prefill
  const defaultAddress = addresses.find((a) => a.isDefault);
  const email = defaultAddress?.email;
  const mobile = defaultAddress?.mobile;
  const fullName = defaultAddress?.fullName;

  const hasAddresses = !!addresses?.length;

  return (
    <div className="space-y-6">
      {/* Address Selection */}
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Address
        </label>
        <AddressSelector
          selectedAddress={selectedAddress as ProfileAddress}
          addresses={addresses}
          isOpen={showAddressSelector}
          onToggle={() => setShowAddressSelector(!showAddressSelector)}
          onSelect={(address) => {
            onAddressChange(address);
            setShowAddressSelector(false); // ✅ Close selector after selection
          }}
          onAddNew={() => {
            setShowAddressModal(true);
            setShowAddressSelector(false); // ✅ Close selector when opening modal
          }}
        />
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          mode="add"
          address={{
            id: crypto.randomUUID(),
            label: "",
            fullName: fullName || "",
            email: email || "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
            mobile: mobile?.replace(/^\+91/, "").replace(/[\s\-+]/g, "") || "",
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