// src/components/admin/shipping/ProvidersContainer.tsx

"use client";

import { useShippingProviders } from "@/components/admin/shipping/providersContainer/hooks/useShippingProviders";
import { ProviderCard } from "./component/ProviderCard";
import { ProviderStatsCards } from "./component/ProviderStatsCards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ConnectProviderModal } from "./component/ConnectProviderModal";
import type { ConnectionRequestBody } from "./types";
/**
 * Container Component
 * 
 * Manages all state, business logic, and coordinates between:
 * - Hook (data fetching & mutations)
 * - Service layer (API calls)
 * - Presentational components (Cards)
 */
export function ProvidersContainer() {

  const {
    providers,
    stats,
    isLoading,
    isConnecting,
    isDisconnecting,
    error,
    refreshProviders,
    connectProvider,
    disconnectProvider,
  } = useShippingProviders();

  // Modal state
  const [connectModalState, setConnectModalState] = useState<{
    open: boolean;
    providerId: string | null;
    providerName: string;
  }>({
    open: false,
    providerId: null,
    providerName: "",
  });

  // Handlers
  const handleOpenConnectModal = (providerId: string, providerName: string) => {
    setConnectModalState({
      open: true,
      providerId,
      providerName,
    });
  };

  const handleCloseConnectModal = () => {
    setConnectModalState({
      open: false,
      providerId: null,
      providerName: "",
    });
  };

  const handleConnect = async (requestBody: ConnectionRequestBody) => {
    if (!connectModalState.providerId) return false;

    const success = await connectProvider(
      connectModalState.providerId,
      requestBody
    );
    if (success) {
      handleCloseConnectModal();
    }
    return success;
  };

  const handleDisconnect = async (providerId: string) => {
    await disconnectProvider(providerId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProviderStatsCards stats={stats} isLoading={isLoading} />
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
  if (error && providers.length === 0) {
    return (
      <Card className="p-8 text-center border-red-200 bg-red-50">
        <p className="text-red-600 font-semibold mb-2">
          Failed to load providers
        </p>
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
          <p className="text-gray-600 mb-2">
            No shipping providers configured yet.
          </p>
          <p className="text-sm text-gray-500">
            Contact your developer to set up shipping providers.
          </p>
        </Card>
      </div>
    );
  }

  // Providers list
  return (
    <>
      <div className="space-y-4">
        {/* Stats */}
        <ProviderStatsCards stats={stats}/>

        {/* Error banner (if any, but providers exist) */}
        {error && (
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-800">{error}</p>
          </Card>
        )}

        {/* Providers */}
        <div className="space-y-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onConnect={() =>
                handleOpenConnectModal(provider.id, provider.name)
              }
              onDisconnect={() => handleDisconnect(provider.id)}
              isConnecting={isConnecting}
              isDisconnecting={isDisconnecting}
            />
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {connectModalState.providerId && (
        <ConnectProviderModal
          providerId={connectModalState.providerId}
          providerName={connectModalState.providerName}
          open={connectModalState.open}
          onClose={handleCloseConnectModal}
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      )}
    </>
  );
}