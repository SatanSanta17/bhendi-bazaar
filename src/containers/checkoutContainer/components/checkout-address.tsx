"use client";

import { AuthenticatedAddress } from "./AuthenticatedAddress";
import { GuestAddress } from "./GuestAddress";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";
import { Address } from "@/domain/profile";
import { useProfileContext } from "@/context/ProfileContext";

interface CheckoutAddressProps {
  selectedAddress: Address | null;
  onAddressChange: (address: Address) => void;
  onAddressUpdated: (id: string, address: Address) => void;
  addresses: Address[];
}

export function CheckoutAddress({
  selectedAddress,
  onAddressChange,
  onAddressUpdated,
  addresses,
  }: CheckoutAddressProps) {
    const { user, loading } = useProfileContext();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return user ? (
    <AuthenticatedAddress
      selectedAddress={selectedAddress}
      onAddressChange={onAddressChange}
      onAddressUpdated={onAddressUpdated}
      addresses={addresses}
    />
  ) : (
    <GuestAddress
      onAddressChange={onAddressChange}
    />
  );
}