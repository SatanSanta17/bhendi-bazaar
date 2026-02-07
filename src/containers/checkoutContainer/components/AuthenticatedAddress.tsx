"use client";

import { useState, useEffect } from "react";
import { AddressModal } from "@/components/profile/address-modal";
import { AddressSelector } from "./AddressSelector";
import { Address } from "@/domain/profile";

interface AuthenticatedAddressProps {
  selectedAddress: Address | null;
  onAddressChange: (address: Address) => void;
  onAddressUpdated: (id: string, address: Address) => void;
  addresses: Address[];
}

export function AuthenticatedAddress({ 
  selectedAddress, 
  onAddressChange, 
  onAddressUpdated, 
  addresses 
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

  const handleSaveNewAddress = async (address: Address) => {
    // If first address make it default
    if (addresses.length === 0) {
      address.isDefault = true;
    }
    // ensure only one default address
    if (address.isDefault) {
      addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    const newAddresses = [...addresses, address];

    onAddressUpdated(address.id, address);
    onAddressChange(address);
    setShowAddressModal(false);
  };

  // Get default user info for modal prefill
  const defaultAddress = addresses.find((a) => a.isDefault);

  const hasAddresses = !!addresses?.length;

  return (
    <div className="space-y-6">
      {/* Address Selection */}
      <div className="space-y-3">
        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Delivery Address
        </label>
        <AddressSelector
          selectedAddress={selectedAddress}
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
            id: "",
            label: "",
            addressLine1: "",
            addressLine2: "",
            landmark: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
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