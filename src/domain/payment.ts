// Payment domain models and contracts

export type PaymentProvider = "razorpay" | "stripe" | "mock";

export interface PaymentGatewayOrder {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
}

export interface CreatePaymentOrderInput {
  amount: number;
  currency: string;
  localOrderId: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface VerifyPaymentInput {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  payload: unknown;
  signature: string;
  rawBody: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: WebhookEvent;
  error?: string;
}

/**
 * Payment Gateway Repository Interface
 * 
 * Abstracts payment provider operations following the repository pattern.
 * Each payment provider (Razorpay, Stripe, etc.) implements this interface.
 */
export interface PaymentGatewayRepository {
  /**
   * Creates a payment order with the gateway
   */
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentGatewayOrder>;

  /**
   * Verifies a payment signature (for client-side payments)
   */
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;

  /**
   * Verifies and processes a webhook event
   */
  verifyWebhook(
    signature: string,
    rawBody: string
  ): Promise<WebhookVerificationResult>;

  /**
   * Returns the provider name
   */
  getProvider(): PaymentProvider;
}