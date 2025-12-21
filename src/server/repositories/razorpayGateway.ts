import Razorpay from "razorpay";
import crypto from "crypto";
import type {
  PaymentGatewayRepository,
  CreatePaymentOrderInput,
  PaymentGatewayOrder,
  VerifyPaymentInput,
  WebhookVerificationResult,
  PaymentProvider,
} from "@/domain/payment";

/**
 * Razorpay implementation of the payment gateway
 */
class RazorpayGatewayRepository implements PaymentGatewayRepository {
  private client: Razorpay | null;
  private webhookSecret: string | undefined;
  private keySecret: string | undefined;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    this.keySecret = keySecret;
    this.client =
      keyId && keySecret
        ? new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          })
        : null;
  }

  private ensureClient(): Razorpay {
    if (!this.client) {
      throw new Error("Razorpay is not configured. Check environment variables.");
    }
    return this.client;
  }

  private ensureKeySecret(): string {
    if (!this.keySecret) {
      throw new Error("Razorpay key secret is not configured.");
    }
    return this.keySecret;
  }

  getProvider(): PaymentProvider {
    return "razorpay";
  }

  async createOrder(
    input: CreatePaymentOrderInput
  ): Promise<PaymentGatewayOrder> {
    const client = this.ensureClient();

    const order = await client.orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.localOrderId,
      notes: {
        localOrderId: input.localOrderId,
        customerName: input.customer?.name ?? "",
        customerEmail: input.customer?.email ?? "",
      },
    });

    return {
      gatewayOrderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      provider: "razorpay",
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    this.ensureClient();
    const keySecret = this.ensureKeySecret();

    try {
      const body = `${input.gatewayOrderId}|${input.paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");

      return expectedSignature === input.signature;
    } catch (error) {
      console.error("Payment verification failed:", error);
      return false;
    }
  }

  async verifyWebhook(
    signature: string,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      console.warn("Razorpay webhook secret not configured. Skipping verification.");
      // In development, you might want to proceed without verification
      return {
        isValid: false,
        error: "Webhook secret not configured",
      };
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return {
          isValid: false,
          error: "Invalid signature",
        };
      }

      const event = JSON.parse(rawBody) as {
        event?: string;
        payload?: unknown;
      };

      return {
        isValid: true,
        event: {
          provider: "razorpay",
          eventType: event.event || "unknown",
          payload: event.payload,
          signature,
          rawBody,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Webhook verification failed",
      };
    }
  }
}

/**
 * Mock payment gateway for testing/development
 */
class MockGatewayRepository implements PaymentGatewayRepository {
  getProvider(): PaymentProvider {
    return "mock";
  }

  async createOrder(
    input: CreatePaymentOrderInput
  ): Promise<PaymentGatewayOrder> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      gatewayOrderId: `mock_order_${Date.now()}`,
      amount: input.amount,
      currency: input.currency,
      provider: "mock",
    };
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    // Mock always succeeds
    return true;
  }

  async verifyWebhook(
    _signature: string,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    try {
      const event = JSON.parse(rawBody);
      return {
        isValid: true,
        event: {
          provider: "mock",
          eventType: event.event || "payment.success",
          payload: event.payload,
          signature: _signature,
          rawBody,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid JSON",
      };
    }
  }
}

// Factory function to get the appropriate gateway
function createPaymentGateway(): PaymentGatewayRepository {
  const provider = process.env.PAYMENT_PROVIDER || "razorpay";

  switch (provider) {
    case "razorpay":
      return new RazorpayGatewayRepository();
    case "mock":
      return new MockGatewayRepository();
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Export singleton instance
export const paymentGateway = createPaymentGateway();