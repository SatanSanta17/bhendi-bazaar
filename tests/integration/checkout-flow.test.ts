/**
 * Checkout Flow Integration Tests
 *
 * Tests the complete checkout process including payment gateway integration,
 * order creation, and cart clearing for both authenticated and guest users
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createMockOrder, createMockCartItem } from '../utils/mock-factories';

// Hoist mock functions to avoid vitest hoisting errors
const { mockPush, mockUseSession } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseSession: vi.fn(),
}));

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: mockUseSession,
}));

vi.mock('@/services/orderService');
vi.mock('@/services/paymentGatewayService');
vi.mock('@/services/cartService');

// Now we can import after mocking
import { useCheckoutPayment } from "@/components/checkoutContainer/hooks/useCheckoutPayment";
import { useCartStore } from '@/store/cartStore';
import { orderService } from '@/services/orderService';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { cartService } from '@/services/cartService';

global.fetch = vi.fn();

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();

    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      status: 'authenticated',
    });

    // Reset cart store
    useCartStore.setState({
      items: [],
      buyNowItem: null,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Checkout - Authenticated User', () => {
    const validOrderData = {
      items: [createMockCartItem()],
      totals: {
        subtotal: 100,
        discount: 10,
        total: 90,
      },
      address: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        line1: '123 Street',
        line2: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      paymentMethod: 'razorpay' as const,
      paymentStatus: 'pending' as const,
    };

    it('should complete checkout with payment successfully', async () => {
      const mockOrder = createMockOrder();
      const mockPaymentOrder = {
        id: 'pay_123',
        amount: 9000,
        currency: 'INR',
      };

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(paymentGatewayService.createPaymentOrder).mockResolvedValueOnce(
        mockPaymentOrder
      );
      vi.mocked(paymentGatewayService.openCheckout).mockImplementation(
        async (_, handlers) => {
          // Simulate successful payment
          await handlers?.onSuccess?.({
            razorpay_order_id: 'pay_123',
            razorpay_payment_id: 'pay_456',
            razorpay_signature: 'sig_789',
          });
        }
      );
      vi.mocked(orderService.updateOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(cartService.clearCart).mockResolvedValueOnce();

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        await result.current.processPayment(validOrderData);
      });

      // Verify order creation
      expect(orderService.createOrder).toHaveBeenCalledWith(validOrderData);

      // Verify payment gateway called
      expect(paymentGatewayService.createPaymentOrder).toHaveBeenCalledWith({
        amount: 9000,
        currency: 'INR',
        localOrderId: mockOrder.id,
        customer: {
          name: validOrderData.address.fullName,
          email: validOrderData.address.email,
          contact: validOrderData.address.phone,
        },
      });

      // Verify cart was cleared
      expect(cartService.clearCart).toHaveBeenCalled();

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith(`/order/${mockOrder.id}`);
    });

    it('should handle free order (zero amount)', async () => {
      const freeOrderData = {
        ...validOrderData,
        totals: { subtotal: 0, discount: 0, total: 0 },
      };
      const mockOrder = createMockOrder();

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(orderService.updateOrder).mockResolvedValueOnce(mockOrder);

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        await result.current.processPayment(freeOrderData);
      });

      // Should not call payment gateway for free orders
      expect(paymentGatewayService.createPaymentOrder).not.toHaveBeenCalled();

      // Should mark order as paid directly
      expect(orderService.updateOrder).toHaveBeenCalledWith(mockOrder.id, {
        paymentStatus: 'paid',
      });

      expect(mockPush).toHaveBeenCalledWith(`/order/${mockOrder.id}`);
    });

    it('should handle payment failure', async () => {
      const mockOrder = createMockOrder();

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(paymentGatewayService.createPaymentOrder).mockResolvedValueOnce({
        id: 'pay_123',
        amount: 9000,
        currency: 'INR',
      });
      vi.mocked(paymentGatewayService.openCheckout).mockImplementation(
        async (_, handlers) => {
          // Simulate payment failure
          await handlers?.onFailure?.({
            error: {
              code: 'BAD_REQUEST_ERROR',
              description: 'Payment failed',
            },
          });
        }
      );

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        await result.current.processPayment(validOrderData);
      });

      // Cart should not be cleared on failure
      expect(cartService.clearCart).not.toHaveBeenCalled();

      // Should show error
      expect(result.current.error).toBeTruthy();
    });

    it('should handle order creation failure', async () => {
      vi.mocked(orderService.createOrder).mockRejectedValueOnce(
        new Error('Failed to create order')
      );

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        try {
          await result.current.processPayment(validOrderData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Failed to create order');
    });

    it('should clear buyNowItem after successful checkout', async () => {
      const mockOrder = createMockOrder();
      const buyNowItem = createMockCartItem();

      // Set up buy now flow
      useCartStore.setState({ buyNowItem });

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(paymentGatewayService.createPaymentOrder).mockResolvedValueOnce({
        id: 'pay_123',
        amount: 9000,
        currency: 'INR',
      });
      vi.mocked(paymentGatewayService.openCheckout).mockImplementation(
        async (_, handlers) => {
          await handlers?.onSuccess?.({
            razorpay_order_id: 'pay_123',
            razorpay_payment_id: 'pay_456',
            razorpay_signature: 'sig_789',
          });
        }
      );
      vi.mocked(orderService.updateOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(cartService.clearCart).mockResolvedValueOnce();

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        await result.current.processPayment(validOrderData);
      });

      // Verify buyNowItem was cleared
      expect(useCartStore.getState().buyNowItem).toBeNull();
    });
  });

  describe('Complete Checkout - Guest User', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should complete guest checkout successfully', async () => {
      const mockOrder = createMockOrder({ userId: null });
      const mockPaymentOrder = {
        id: 'pay_123',
        amount: 9000,
        currency: 'INR',
      };

      const guestOrderData = {
        items: [createMockCartItem()],
        totals: {
          subtotal: 100,
          discount: 10,
          total: 90,
        },
        address: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phone: '9876543210',
          line1: '456 Avenue',
          line2: '',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
        },
        paymentMethod: 'razorpay' as const,
        paymentStatus: 'pending' as const,
      };

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(paymentGatewayService.createPaymentOrder).mockResolvedValueOnce(
        mockPaymentOrder
      );
      vi.mocked(paymentGatewayService.openCheckout).mockImplementation(
        async (_, handlers) => {
          await handlers?.onSuccess?.({
            razorpay_order_id: 'pay_123',
            razorpay_payment_id: 'pay_456',
            razorpay_signature: 'sig_789',
          });
        }
      );
      vi.mocked(orderService.updateOrder).mockResolvedValueOnce(mockOrder);

      const { result } = renderHook(() => useCheckoutPayment());

      await act(async () => {
        await result.current.processPayment(guestOrderData);
      });

      // Should not call cartService.clearCart for guest users
      expect(cartService.clearCart).not.toHaveBeenCalled();

      // Should navigate to order page
      expect(mockPush).toHaveBeenCalledWith(`/order/${mockOrder.id}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit error during order creation', async () => {
      vi.mocked(orderService.createOrder).mockRejectedValueOnce(
        new Error('Too many requests. Please try again later.')
      );

      const { result } = renderHook(() => useCheckoutPayment());

      const orderData = {
        items: [createMockCartItem()],
        totals: { subtotal: 100, discount: 0, total: 100 },
        address: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          line1: '123 Street',
          line2: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        paymentMethod: 'razorpay' as const,
        paymentStatus: 'pending' as const,
      };

      await act(async () => {
        try {
          await result.current.processPayment(orderData);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toContain('Too many requests');
    });

    it('should handle payment gateway service error', async () => {
      const mockOrder = createMockOrder();

      vi.mocked(orderService.createOrder).mockResolvedValueOnce(mockOrder);
      vi.mocked(paymentGatewayService.createPaymentOrder).mockRejectedValueOnce(
        new Error('Payment gateway unavailable')
      );

      const { result } = renderHook(() => useCheckoutPayment());

      const orderData = {
        items: [createMockCartItem()],
        totals: { subtotal: 100, discount: 0, total: 100 },
        address: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          line1: '123 Street',
          line2: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        paymentMethod: 'razorpay' as const,
        paymentStatus: 'pending' as const,
      };

      await act(async () => {
        try {
          await result.current.processPayment(orderData);
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toContain('Payment gateway unavailable');
    });
  });
});

