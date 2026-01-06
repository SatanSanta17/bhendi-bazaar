/**
 * Provider Card Component
 * 
 * Displays a single shipping provider with its details and toggle switch.
 * Pure presentational component - receives data and callbacks as props.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ExternalLink } from "lucide-react";
import type { AdminProviderSummary } from "@/server/services/admin/shippingService";

interface ProviderCardProps {
  provider: AdminProviderSummary;
  isToggling: boolean;
  onToggle: (providerId: string, currentStatus: boolean) => void;
}

export function ProviderCard({ provider, isToggling, onToggle }: ProviderCardProps) {
  const canToggle = provider.hasConfig && !isToggling;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Provider Header */}
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">{provider.name}</h3>
            <Badge variant={provider.isEnabled ? "default" : "secondary"}>
              {provider.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant="outline">Priority: {provider.priority}</Badge>
          </div>

          {/* Description */}
          {provider.description && (
            <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
          )}

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

            {/* Configuration Warning */}
            {!provider.hasConfig && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ No Configuration
              </Badge>
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

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 ml-4">
          <Switch
            checked={provider.isEnabled}
            onCheckedChange={() => onToggle(provider.id, provider.isEnabled)}
            disabled={!canToggle}
            aria-label={`Toggle ${provider.name}`}
          />
          <span className="text-sm text-gray-600 min-w-[70px]">
            {isToggling ? "Updating..." : provider.isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Warning for unconfigured providers */}
      {!provider.hasConfig && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Configuration Required:</strong> This provider needs to be
            configured by a developer before it can be enabled.
          </p>
        </div>
      )}
    </Card>
  );
}

