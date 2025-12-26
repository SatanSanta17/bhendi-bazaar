/**
 * PaymentService Tests
 *
 * Tests for server-side payment service business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentService, PaymentService } from '@/server/services/paymentService';
import { razorpayRepository } from '@/server/repositories/razorpayRepository';
import type {
  ServerPaymentOrder,
  CreatePaymentOrderInput,
  VerifyPaymentInput,
  PaymentVerificationResult,
  WebhookVerificationResult,
  WebhookEvent,
} from '@/server/domain/payment';

// Mock the razorpay repository
vi.mock('@/server/repositories/razorpayRepository', () => ({
  razorpayRepository: {
    createOrder: vi.fn(),
    verifyPayment: vi.fn(),
    verifyWebhook: vi.fn(),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock payment order
  const createMockPaymentOrder = (
    overrides?: Partial<ServerPaymentOrder>
  ): ServerPaymentOrder => ({
    gatewayOrderId: 'order_MockGatewayId123',
    amount: 10000, // 100 INR in paise
    currency: 'INR',
    provider: 'razorpay',
    key: 'rzp_test_key',
    ...overrides,
  });

  // Helper function to create mock payment order input
  const createMockPaymentInput = (
    overrides?: Partial<CreatePaymentOrderInput>
  ): CreatePaymentOrderInput => ({
    amount: 10000,
    currency: 'INR',
    localOrderId: 'order-123',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      contact: '9876543210',
    },
    ...overrides,
  });

  describe('createPaymentOrder', () => {
    it('should create payment order with valid input', async () => {
      const input = createMockPaymentInput();
      const mockOrder = createMockPaymentOrder();
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result).toEqual(mockOrder);
      expect(razorpayRepository.createOrder).toHaveBeenCalledWith(input);
      expect(razorpayRepository.createOrder).toHaveBeenCalledTimes(1);
    });

    it('should create payment order with minimum required fields', async () => {
      const input: CreatePaymentOrderInput = {
        amount: 5000,
        currency: 'INR',
        localOrderId: 'order-456',
      };
      const mockOrder = createMockPaymentOrder({ amount: 5000 });
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result).toEqual(mockOrder);
    });

    it('should throw error for zero amount', async () => {
      const input = createMockPaymentInput({ amount: 0 });

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Amount must be greater than 0'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should throw error for negative amount', async () => {
      const input = createMockPaymentInput({ amount: -1000 });

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Amount must be greater than 0'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should throw error for amount exceeding maximum limit', async () => {
      const input = createMockPaymentInput({ amount: 100000001 }); // > 1 crore paise

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Amount exceeds maximum limit'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should accept amount at maximum limit', async () => {
      const input = createMockPaymentInput({ amount: 100000000 }); // Exactly 1 crore
      const mockOrder = createMockPaymentOrder({ amount: 100000000 });
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result).toEqual(mockOrder);
    });

    it('should throw error for missing currency', async () => {
      const input = { ...createMockPaymentInput(), currency: '' };

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Only INR currency is supported'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should throw error for invalid currency (not INR)', async () => {
      const input = createMockPaymentInput({ currency: 'USD' as any });

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Only INR currency is supported'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should throw error for missing localOrderId', async () => {
      const input = createMockPaymentInput({ localOrderId: '' });

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Local order ID is required'
      );

      expect(razorpayRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should handle order creation with all customer details', async () => {
      const input = createMockPaymentInput({
        customer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          contact: '9123456789',
        },
      });
      const mockOrder = createMockPaymentOrder();
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result).toEqual(mockOrder);
      expect(razorpayRepository.createOrder).toHaveBeenCalledWith(input);
    });

    it('should handle various amount values (paise conversion)', async () => {
      const testAmounts = [
        1, // 0.01 INR
        100, // 1 INR
        1000, // 10 INR
        10000, // 100 INR
        99999999, // Just below max
      ];

      for (const amount of testAmounts) {
        const input = createMockPaymentInput({ amount });
        const mockOrder = createMockPaymentOrder({ amount });
        vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

        const result = await paymentService.createPaymentOrder(input);

        expect(result.amount).toBe(amount);
      }
    });
  });

  describe('verifyPayment', () => {
    it('should verify valid payment successfully', async () => {
      const input: VerifyPaymentInput = {
        gatewayOrderId: 'order_MockId123',
        paymentId: 'pay_MockPaymentId456',
        signature: 'valid_signature_hash',
      };
      const mockResult: PaymentVerificationResult = {
        isValid: true,
      };
      vi.mocked(razorpayRepository.verifyPayment).mockResolvedValue(mockResult);

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(true);
      expect(razorpayRepository.verifyPayment).toHaveBeenCalledWith(input);
    });

    it('should return invalid for incorrect signature', async () => {
      const input: VerifyPaymentInput = {
        gatewayOrderId: 'order_MockId123',
        paymentId: 'pay_MockPaymentId456',
        signature: 'invalid_signature',
      };
      const mockResult: PaymentVerificationResult = {
        isValid: false,
        error: 'Invalid signature',
      };
      vi.mocked(razorpayRepository.verifyPayment).mockResolvedValue(mockResult);

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should return error for missing gatewayOrderId', async () => {
      const input = {
        gatewayOrderId: '',
        paymentId: 'pay_123',
        signature: 'sig_123',
      };

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required verification parameters');
      expect(razorpayRepository.verifyPayment).not.toHaveBeenCalled();
    });

    it('should return error for missing paymentId', async () => {
      const input = {
        gatewayOrderId: 'order_123',
        paymentId: '',
        signature: 'sig_123',
      };

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required verification parameters');
      expect(razorpayRepository.verifyPayment).not.toHaveBeenCalled();
    });

    it('should return error for missing signature', async () => {
      const input = {
        gatewayOrderId: 'order_123',
        paymentId: 'pay_123',
        signature: '',
      };

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required verification parameters');
      expect(razorpayRepository.verifyPayment).not.toHaveBeenCalled();
    });

    it('should return error when all parameters are missing', async () => {
      const input = {
        gatewayOrderId: '',
        paymentId: '',
        signature: '',
      };

      const result = await paymentService.verifyPayment(input);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required verification parameters');
    });
  });

  describe('verifyWebhook', () => {
    it('should verify valid webhook successfully', async () => {
      const signature = 'valid_webhook_signature';
      const rawBody = JSON.stringify({
        event: 'payment.captured',
        payload: { payment_id: 'pay_123' },
      });
      const mockEvent: WebhookEvent = {
        provider: 'razorpay',
        eventType: 'payment.captured',
        payload: { payment_id: 'pay_123' },
        signature,
        rawBody,
      };
      const mockResult: WebhookVerificationResult = {
        isValid: true,
        event: mockEvent,
      };
      vi.mocked(razorpayRepository.verifyWebhook).mockResolvedValue(mockResult);

      const result = await paymentService.verifyWebhook(signature, rawBody);

      expect(result.isValid).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.eventType).toBe('payment.captured');
      expect(razorpayRepository.verifyWebhook).toHaveBeenCalledWith(signature, rawBody);
    });

    it('should return invalid for tampered webhook', async () => {
      const signature = 'invalid_signature';
      const rawBody = JSON.stringify({ event: 'payment.captured' });
      const mockResult: WebhookVerificationResult = {
        isValid: false,
        error: 'Invalid webhook signature',
      };
      vi.mocked(razorpayRepository.verifyWebhook).mockResolvedValue(mockResult);

      const result = await paymentService.verifyWebhook(signature, rawBody);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should return error for missing signature', async () => {
      const rawBody = JSON.stringify({ event: 'test' });

      const result = await paymentService.verifyWebhook('', rawBody);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing webhook signature or body');
      expect(razorpayRepository.verifyWebhook).not.toHaveBeenCalled();
    });

    it('should return error for missing rawBody', async () => {
      const signature = 'sig_123';

      const result = await paymentService.verifyWebhook(signature, '');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing webhook signature or body');
      expect(razorpayRepository.verifyWebhook).not.toHaveBeenCalled();
    });

    it('should return error when both signature and body are missing', async () => {
      const result = await paymentService.verifyWebhook('', '');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing webhook signature or body');
    });

    it('should handle different webhook event types', async () => {
      const eventTypes = [
        'payment.captured',
        'payment.failed',
        'payment.authorized',
        'order.paid',
        'refund.created',
      ];

      for (const eventType of eventTypes) {
        const signature = 'valid_sig';
        const rawBody = JSON.stringify({ event: eventType });
        const mockEvent: WebhookEvent = {
          provider: 'razorpay',
          eventType,
          payload: {},
          signature,
          rawBody,
        };
        const mockResult: WebhookVerificationResult = {
          isValid: true,
          event: mockEvent,
        };
        vi.mocked(razorpayRepository.verifyWebhook).mockResolvedValue(mockResult);

        const result = await paymentService.verifyWebhook(signature, rawBody);

        expect(result.isValid).toBe(true);
        expect(result.event?.eventType).toBe(eventType);
      }
    });
  });

  describe('PaymentService instance', () => {
    it('should export a singleton instance', () => {
      expect(paymentService).toBeInstanceOf(PaymentService);
    });

    it('should be the same instance across imports', () => {
      const service1 = paymentService;
      const service2 = paymentService;

      expect(service1).toBe(service2);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle extremely large amounts near the limit', async () => {
      const input = createMockPaymentInput({ amount: 99999999 });
      const mockOrder = createMockPaymentOrder({ amount: 99999999 });
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result.amount).toBe(99999999);
    });

    it('should handle minimum amount (1 paisa)', async () => {
      const input = createMockPaymentInput({ amount: 1 });
      const mockOrder = createMockPaymentOrder({ amount: 1 });
      vi.mocked(razorpayRepository.createOrder).mockResolvedValue(mockOrder);

      const result = await paymentService.createPaymentOrder(input);

      expect(result.amount).toBe(1);
    });

    it('should validate currency case-sensitivity', async () => {
      const input = createMockPaymentInput({ currency: 'inr' as any });

      await expect(paymentService.createPaymentOrder(input)).rejects.toThrow(
        'Only INR currency is supported'
      );
    });
  });
});

