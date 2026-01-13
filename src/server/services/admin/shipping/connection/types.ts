/**
 * Admin Connection Types
 * Types specific to admin connection feature
 */

import type { ConnectionRequestBody, ProviderConnectionResult } from "@/server/shipping/domain/shipping.types";

export interface AdminConnectionRequest {
    requestBody: ConnectionRequestBody;
  }

  export interface AdminDisconnectionRequest {
    success: boolean;
    provider: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        isConnected: boolean;
        websiteUrl: string | null;
        updatedAt: Date | null;
        createdAt: Date | null;
    };
    error?: string;
  }
  
  export interface AdminConnectionResult {
    success: boolean;
    provider: ShippingProvider;
    error?: string;
  }
  // Define client-side types (don't import from /server)
export interface ShippingProvider {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isConnected: boolean;
    connectedAt: Date | null;
    isAuthenticated: boolean;
    authenticatedBy: string;
    lastAuthAt: Date | null;
    accountEmail: string | null;
    accountName: string | null;
    priority: number;
    supportedModes: string[];
    logoUrl: string | null;
    websiteUrl: string | null;
    updatedAt: Date | null;
    createdAt: Date | null;
  }