"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ProfileAddress } from "@/domain/profile";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressModal } from "./address-modal";

interface AddressesSectionProps {
  addresses: ProfileAddress[];
  loading?: boolean;
  saving?: boolean;
  onSaveAddress: (address: ProfileAddress) => Promise<void>;
  onDeleteAddress: (addressId: string) => Promise<void>;
  onSetDefault: (addressId: string) => Promise<void>;
}

export function AddressesSection({
  addresses,
  loading,
  saving,
  onSaveAddress,
  onDeleteAddress,
  onSetDefault,
}: AddressesSectionProps) {
  const [activeAddress, setActiveAddress] = useState<ProfileAddress | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"view" | "edit" | "add" | null>(
    null
  );

  const hasAddresses = addresses.length > 0;

  function handleAddClick() {
    setActiveAddress({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      label: "",
      name: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      isDefault: addresses.length === 0,
    });
    setModalMode("add");
  }

  function handleAddressClick(address: ProfileAddress) {
    setActiveAddress(address);
    setModalMode("view");
  }

  function handleCloseModal() {
    setActiveAddress(null);
    setModalMode(null);
  }

  async function handleSave(address: ProfileAddress) {
    await onSaveAddress(address);
    handleCloseModal();
  }

  async function handleDelete(addressId: string) {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }
    await onDeleteAddress(addressId);
    handleCloseModal();
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
                Addresses
              </p>
              <p className="text-xs text-muted-foreground">
                Manage your delivery locations and contact details.
              </p>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={handleAddClick}
              disabled={loading || saving}
              className="rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {!loading && !hasAddresses && (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any saved addresses yet. Add one to speed up
              checkout.
            </p>
          )}
          {loading && (
            <p className="text-sm text-muted-foreground">
              Loading your addresses…
            </p>
          )}
          {hasAddresses && (
            <div className="space-y-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => handleAddressClick(address)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-left text-xs transition-colors hover:bg-muted/70"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{address.label}</span>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-[0.6rem]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-1 text-muted-foreground">
                      {[
                        address.line1,
                        address.line2,
                        address.city,
                        address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[0.7rem] text-muted-foreground">
                    <span>{address.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {activeAddress && modalMode && (
        <AddressModal
          mode={modalMode}
          address={activeAddress}
          saving={saving ?? false}
          onClose={handleCloseModal}
          onSave={handleSave}
          onStartEdit={() => setModalMode("edit")}
          onSetDefault={
            activeAddress.isDefault
              ? undefined
              : () => onSetDefault(activeAddress.id)
          }
          onDelete={() => handleDelete(activeAddress.id)}
        />
      )}
    </>
  );
}

