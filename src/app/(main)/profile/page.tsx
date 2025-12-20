"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ProfileAddress } from "@/domain/profile";
import type { Order } from "@/domain/order";
import { orderRepository } from "@/server/repositories/orderRepository";
import { useProfile } from "@/hooks/useProfile";
import { ProfileCard } from "@/components/profile/profile-card";
import { AddressesSection } from "@/components/profile/addresses-section";
import { RecentOrdersSection } from "@/components/profile/recent-orders-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { status, user: authUser } = useAuth();
  const isAuthenticated = status === "authenticated";

  const {
    user,
    profile,
    loading,
    error,
    saving,
    updateAddresses,
    updateUserInfo,
    updateProfilePic,
  } = useProfile(isAuthenticated);

  const [orders, setOrders] = useState<Order[]>([]);

  // Load recent orders
  useEffect(() => {
    if (!isAuthenticated) return;
    orderRepository.list().then((all) => {
      setOrders(all.slice(0, 3));
    });
  }, [isAuthenticated]);

  // Handle saving an address (add or update)
  async function handleSaveAddress(address: ProfileAddress) {
    if (!profile) return;

    const existing = profile.addresses ?? [];
    const index = existing.findIndex((a) => a.id === address.id);

    let next = [...existing];

    if (index === -1) {
      // Add new address
      next.push(address);
    } else {
      // Update existing address
      next[index] = address;
    }

    // Ensure only one default address
    if (address.isDefault) {
      next = next.map((a) => ({
        ...a,
        isDefault: a.id === address.id,
      }));
    }

    await updateAddresses(next);
  }

  async function handleDeleteAddress(addressId: string) {
    if (!profile) return;
    const next = (profile.addresses ?? []).filter((a) => a.id !== addressId);
    await updateAddresses(next);
  }

  // Handle setting an address as default
  async function handleSetDefault(addressId: string) {
    if (!profile) return;
    const next = (profile.addresses ?? []).map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    await updateAddresses(next);
  }

  if (status === "loading") {
    return (
      <div className="space-y-4">
        <Header />
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <Header />
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle>Sign in to view your profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm text-muted-foreground">
            <p>
              Your profile hosts your saved addresses and recent orders once
              you&apos;re signed in.
            </p>
            <Button
              asChild
              className="mt-1 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              <a href="/signin">Go to login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {/* Section 1: Primary Info */}
      <section>
        <ProfileCard
          user={user}
          profilePic={profile?.profilePic ?? ""}
          loading={loading}
          saving={saving}
          fallbackName={authUser?.name ?? ""}
          onUpdate={updateUserInfo}
          onUpdateProfilePic={updateProfilePic}
        />
      </section>

      {/* Section 2: Addresses */}
      <section>
        <AddressesSection
          addresses={profile?.addresses ?? []}
          loading={loading}
          saving={saving}
          onSaveAddress={handleSaveAddress}
          onDeleteAddress={handleDeleteAddress}
          onSetDefault={handleSetDefault}
        />
      </section>

      {/* Section 3: Recent Orders */}
      <section>
        <RecentOrdersSection orders={orders} />
      </section>
    </div>
  );
}

function Header() {
  return (
    <header className="space-y-1">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
        Profile
      </p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Your Bhendi Bazaar profile
      </h1>
    </header>
  );
}
