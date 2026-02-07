"use client";

import { useState, useEffect } from "react";
import { AddressModal } from "@/components/profile/address-modal";
import { AddressSelector } from "./AddressSelector";
import { DeliveryAddress } from "@/domain/profile";

interface AuthenticatedAddressProps {
  selectedAddress: DeliveryAddress | null;
  onAddressChange: (address: DeliveryAddress) => void;
  onAddressAdded: (address: DeliveryAddress) => void;
  onAddressUpdated: (id: string, address: DeliveryAddress) => void;
  addresses: DeliveryAddress[];
}

export function AuthenticatedAddress({ 
  selectedAddress, 
  onAddressChange,
  onAddressAdded,
  onAddressUpdated, 
  addresses 
}: AuthenticatedAddressProps) {
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // ✅ Auto-select default address on mount
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find((a) => a.metadata?.isDefault) || addresses[0];
      onAddressChange(defaultAddress);
    }
  }, [addresses, selectedAddress, onAddressChange]);

  const handleSaveNewAddress = async (address: DeliveryAddress) => {
    // If first address make it default
    if (addresses.length === 0) {
      address.metadata = { ...address.metadata, isDefault: true };
    }
    // ensure only one default address
    if (address.metadata?.isDefault) {
      addresses.forEach((a) => {
        a.metadata = { ...a.metadata, isDefault: false };
      });
    }

    onAddressAdded(address);
    onAddressChange(address);
    setShowAddressModal(false);
  };

  // Get default user info for modal prefill
  const defaultAddress = addresses.find((a) => a.metadata?.isDefault);

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
            fullName: "",
            mobile: "",
            email: "",
            addressLine1: "",
            addressLine2: "",
            landmark: "",
            city: "",
            state: "",
            country: "India",
            pincode: "",
            metadata: {},
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