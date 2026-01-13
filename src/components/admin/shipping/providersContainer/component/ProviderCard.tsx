// src/components/admin/shipping/ProviderCard.tsx

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { ShippingProvider } from "../types";

interface ProviderCardProps {
  provider: ShippingProvider;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

/**
 * Pure Presentational Component
 * 
 * Receives all data and handlers as props.
 * No internal state or business logic.
 */
export function ProviderCard({
  provider,
  onConnect,
  onDisconnect,
  isConnecting = false,
  isDisconnecting = false,
}: ProviderCardProps) {
  return (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Account"}
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center gap-6 mt-3 text-sm flex-wrap">
            
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
      </div>
    </Card>
  );
}