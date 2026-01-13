"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { AdminProviderSummary } from "@/server/services/admin/shippingService";
import { useState } from "react";
import { ConnectProviderModal } from "./ConnectProviderModal";

interface ProviderCardProps {
  provider: AdminProviderSummary;
  onDisconnect?: (providerId: string) => Promise<void>;
}

export function ProviderCard({ provider, onDisconnect }: ProviderCardProps) {
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setDisconnecting(true);
    try {
      await onDisconnect(provider.id);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Provider Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <Badge variant={provider.isConnected ? "default" : "secondary"}>
                {provider.isConnected ? "Connected" : "Not Connected"}
              </Badge>
              <Badge variant="outline">Priority: {provider.priority}</Badge>
            </div>

            {/* Description */}
            {provider.description && (
              <p className="text-sm text-gray-600 mt-2">
                {provider.description}
              </p>
            )}

            {/* Connection Status */}
            <div className="mt-3">
              {provider.isConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600">Connected</span>
                  </div>
                  {provider.accountEmail && (
                    <p className="text-xs text-gray-500">
                      {provider.accountEmail}
                    </p>
                  )}
                  {onDisconnect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  )}
                </div>
              ) : (
                <Button size="sm" onClick={() => setConnectModalOpen(true)}>
                  Connect Account
                </Button>
              )}
            </div>

            {/* Details */}
            <div className="flex items-center gap-6 mt-3 text-sm flex-wrap">
              {/* Supported Modes */}
              <div>
                <span className="text-gray-600">Supported Modes:</span>
                <div className="flex gap-2 mt-1">
                  {provider.supportedModes.map((mode) => (
                    <Badge key={mode} variant="outline" className="text-xs">
                      {mode.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              {provider.serviceablePincodes.length > 0 && (
                <div>
                  <span className="text-gray-600">Service Areas:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {provider.serviceablePincodes.length} pincodes
                  </Badge>
                </div>
              )}
            </div>

            {/* Website Link */}
            {provider.websiteUrl && (
              <a
                href={provider.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
              >
                Visit Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {/* Remove entire toggle switch section */}
        </div>
      </Card>

      {/* Connect Modal */}
      <ConnectProviderModal
        providerId={provider.id}
        providerName={provider.name}
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={() => {
          setConnectModalOpen(false);
          window.location.reload(); // Or use a callback prop
        }}
      />
    </>
  );
}
