/**
 * Provider Stats Cards Component
 * 
 * Displays statistics for shipping providers (total, enabled, disabled).
 * Pure presentational component.
 */

import { Card } from "@/components/ui/card";
import type { ProviderStats } from "@/server/services/admin/shippingService";

interface ProviderStatsCardsProps {
  stats: ProviderStats;
  loading?: boolean;
}

export function ProviderStatsCards({ stats, loading }: ProviderStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-600">Total Providers</div>
        <div className="text-2xl font-bold mt-1">{stats.total}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-600">Connected</div>
        <div className="text-2xl font-bold text-green-600 mt-1">
          {stats.connected}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-600">Disconnected</div>
        <div className="text-2xl font-bold text-gray-400 mt-1">
          {stats.disconnected}
        </div>
      </Card>
    </div>
  );
}

