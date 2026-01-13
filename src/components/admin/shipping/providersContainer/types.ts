// src/services/admin/shippingService.ts

// Define client-side types (don't import from /server)
export interface ShippingProvider {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isConnected: boolean;
    connectedAt: string | null;
    connectedBy: string | null;
    isAuthenticated: boolean;
    accountEmail: string | null;
    accountName: string | null;
    priority: number;
    supportedModes: string[];
    logoUrl: string | null;
    websiteUrl: string | null;
  }
  
  export interface ShippingProviderStats {
    total: number;
    connected: number;
    disconnected: number;
  }

  export type ConnectionRequestBody =
  | {
      type: "email_password";
      email: string;
      password: string;
    }
  | {
      type: "api_key";
      apiKey: string;
    }
  | {
      type: "oauth";
      clientId: string;
      clientSecret: string;
    };
  