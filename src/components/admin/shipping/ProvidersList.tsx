/**
 * Providers List Component
 * 
 * Container component that uses the hook and renders provider cards.
 * Manages state but delegates presentation to child components.
 */

"use client";

import { Card } from "@/components/ui/card";
import { useShippingProviders } from "@/hooks/admin/useShippingProviders";
import { ProviderStatsCards } from "./ProviderStatsCards";
import { ProviderCard } from "./ProviderCard";
import { Button } from "@/components/ui/button";

export function ProvidersList() {
  const { providers, stats, loading, error, refreshProviders } =
    useShippingProviders();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <ProviderStatsCards stats={stats} loading />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 text-center border-red-200 bg-red-50">
        <p className="text-red-600 font-semibold mb-2">Failed to load providers</p>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <Button onClick={refreshProviders} variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  // Empty state
  if (providers.length === 0) {
    return (
      <div className="space-y-4">
        <ProviderStatsCards stats={stats} />
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-2">No shipping providers configured yet.</p>
          <p className="text-sm text-gray-500">
            Contact your developer to set up shipping providers.
          </p>
        </Card>
      </div>
    );
  }

  // Providers list
  return (
    <div className="space-y-4">
      {/* Stats */}
      <ProviderStatsCards stats={stats} />

      {/* Providers */}
      <div className="space-y-3">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}

