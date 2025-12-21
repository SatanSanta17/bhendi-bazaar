import type {
    CreatePaymentOrderInput,
    PaymentGatewayOrder,
  } from "@/domain/payment";
  
  export interface PaymentRepository {
    createOrder(input: CreatePaymentOrderInput): Promise<PaymentGatewayOrder>;
  }
  
  /**
   * API-based payment repository (client-side wrapper)
   * Makes fetch calls to payment API endpoints
   */
  class ApiPaymentRepository implements PaymentRepository {
    async createOrder(
      input: CreatePaymentOrderInput
    ): Promise<PaymentGatewayOrder> {
      const res = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to create payment order. Please try again."
        );
      }
  
      return res.json();
    }
  }
  
  /**
   * Mock payment repository for development/testing
   */
  class MockPaymentRepository implements PaymentRepository {
    async createOrder(
      input: CreatePaymentOrderInput
    ): Promise<PaymentGatewayOrder> {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      return {
        gatewayOrderId: `mock_order_${Date.now()}`,
        amount: input.amount,
        currency: input.currency,
        provider: "mock",
      };
    }
  }
  
  const USE_MOCK = false;
  
  export const paymentRepository: PaymentRepository = USE_MOCK
    ? new MockPaymentRepository()
    : new ApiPaymentRepository();