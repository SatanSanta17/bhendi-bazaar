/**
 * Shipping Providers Management Page
 * 
 * Admin page for viewing and managing shipping providers.
 * Admins can enable/disable providers configured by developers.
 */

import { Metadata } from "next";
import { ProvidersList } from "@/components/admin/shipping/ProvidersList";
import { SectionHeader } from "@/components/shared/SectionHeader";
export const metadata: Metadata = {
  title: "Shipping Providers | Admin",
  description: "Manage shipping providers",
};

export default function ShippingProvidersPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <SectionHeader title="Shipping Providers" description="Manage shipping providers and their availability" />

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enable providers to use them for shipping orders</li>
          <li>• Disable providers to temporarily stop using them</li>
          <li>• Priority determines which provider is preferred (higher = better)</li>
          <li>• Provider configuration is handled by developers</li>
          <li>• Only configured providers can be enabled</li>
        </ul>
      </div>

      {/* Providers List */}
      <ProvidersList />
    </div>
  );
}

