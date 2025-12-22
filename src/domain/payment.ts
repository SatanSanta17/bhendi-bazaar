/**
 * Client-side domain types for Payment
 *
 * These types are used on the client-side (components, hooks).
 */

export type PaymentProvider = "razorpay" | "stripe" | "mock";

export interface PaymentGatewayOrder {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  key?: string; // Public API key for client-side SDK
}
