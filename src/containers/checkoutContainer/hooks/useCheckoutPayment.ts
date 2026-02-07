// hooks/checkout/useCheckoutPayment.ts

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { paymentGatewayService } from "@/services/paymentGatewayService";
import { orderService } from "@/services/orderService";
import { cartService } from "@/services/cartService";
import { useCartStore } from "@/store/cartStore";
import type {
  OrderAddress,
} from "@/domain/order";
import type { CartItem, CartTotals } from "@/domain/cart";
import type { ShippingGroup } from "@/domain/shipping";

interface ProcessPaymentInput {
  items: CartItem[];
  totals: CartTotals;
  address: OrderAddress;
  notes?: string;
  paymentMethod: string;
  paymentStatus: string;
  isBuyNow: boolean;
}

interface ProcessPaymentWithShipmentsInput {
  shippingGroups: ShippingGroup[];
  totals: {
    itemsTotal: number;
    shippingTotal: number;
    discount: number;
    grandTotal: number;
  };
  address: OrderAddress;
  notes?: string;
  paymentMethod: string;
  paymentStatus: string;
  isBuyNow: boolean;
}

export function useCheckoutPayment() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (orderData: ProcessPaymentInput) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Step 0: Validate stock BEFORE creating order
      const stockCheck = await fetch("/api/products/check-stock", {
        method: "POST",
        body: JSON.stringify({
          items: orderData.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      }).then((r) => r.json());

      if (!stockCheck.available) {
        const outOfStock = stockCheck.items.filter((i: any) => !i.available);
        throw new Error(
          `Sorry, ${outOfStock[0].name} is out of stock. Please update your cart.`
        );
      }
      // Step 1: Create order
      const order = await orderService.createOrder(orderData);

      const amountInMinorUnit = Math.round(orderData.totals.total * 100);

      // Free order case
      if (amountInMinorUnit <= 0) {
        await orderService.updateOrder(order.id, { paymentStatus: "paid" });
        router.push(`/order/${order.id}`);
        return order;
      }

      // Step 2: Create payment gateway order
      const paymentOrder = await paymentGatewayService.createPaymentOrder({
        amount: amountInMinorUnit,
        currency: "INR",
        localOrderId: order.id,
        customer: {
          name: orderData.address.fullName,
          email: orderData.address.email,
          contact: orderData.address.mobile,
        },
      });

      // Step 3: Open Razorpay checkout
      await paymentGatewayService.openCheckout(paymentOrder, {
        onSuccess: async (response) => {
          try {
            // Update order with payment info
            await orderService.updateOrder(order.id, {
              paymentStatus: "paid",
              paymentMethod: "razorpay",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Clear cart - server AND local
            if (!orderData.isBuyNow) {
              // Regular cart: Clear both server and local
              if (session?.user) {
                await cartService.clearCart();
              }
              useCartStore.getState().clear();
            }
            // Redirect to order page
            router.push(`/order/${order.id}`);
          } catch (error) {
            console.error("Failed to update order after payment:", error);
            setError(
              "Payment succeeded but order update failed. Please contact support."
            );
          }
        },
        onFailure: async (error) => {
          console.error("Payment failed:", error);
          await orderService.updateOrder(order.id, {
            paymentStatus: "failed",
          });
          setError(
            error?.error?.description || "Payment failed. Please try again."
          );
          setIsProcessing(false);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });

      return order;
    } catch (error) {
      console.error("Checkout error:", error);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes("Too many")) {
        setError(error.message); // Will show the time remaining message
      } else {
        setError(error instanceof Error ? error.message : "Checkout failed");
      }

      setIsProcessing(false);
      throw error;
    }
  };

  /**
   * NEW: Process payment with multiple shipments
   * Production-ready flow with post-payment fulfillment
   * 
   * Flow:
   * 1. Validate stock
   * 2. Create order (pending_payment)
   * 3. Create payment
   * 4. On payment success:
   *    - Update order (paid)
   *    - Fulfill order (create with providers)
   *    - Clear cart
   *    - Redirect
   */
  const processPaymentWithShipments = async (
    orderData: ProcessPaymentWithShipmentsInput
  ) => {
    setError(null);
    setIsProcessing(true);

    try {
      console.log('🛒 Starting checkout with multiple shipments...');

      // Step 0: Validate stock for all items across all groups
      const allItems = orderData.shippingGroups.flatMap((group) => group.items);
      const stockCheck = await fetch("/api/products/check-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: allItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      }).then((r) => r.json());

      if (!stockCheck.available) {
        const outOfStock = stockCheck.items.filter((i: any) => !i.available);
        throw new Error(
          `Sorry, ${outOfStock[0].name} is out of stock. Please update your cart.`
        );
      }

      // Step 1: Create order with shipments (pending payment & fulfillment)
      console.log('📦 Creating order with shipments...');
      const order = await orderService.createOrderWithShipments({
        shippingGroups: orderData.shippingGroups,
        totals: orderData.totals,
        address: orderData.address,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
      });

      const amountInMinorUnit = Math.round(orderData.totals.grandTotal * 100);

      // Free order case
      if (amountInMinorUnit <= 0) {
        await orderService.updateOrder(order.id, { paymentStatus: "paid" });
        console.log('✅ Free order confirmed! Manual fulfillment required.');
        router.push(`/order/${order.id}`);
        return order;
      }

      // Step 2: Create payment gateway order
      console.log('💳 Creating Razorpay payment order...');
      const paymentOrder = await paymentGatewayService.createPaymentOrder({
        amount: amountInMinorUnit,
        currency: "INR",
        localOrderId: order.id,
        customer: {
          name: orderData.address.fullName,
          email: orderData.address.email,
          contact: orderData.address.mobile,
        },
      });

      // Step 3: Open Razorpay checkout
      console.log('🔐 Opening Razorpay checkout modal...');
      await paymentGatewayService.openCheckout(paymentOrder, {
        onSuccess: async (response) => {
          try {
            console.log('✅ Payment successful! Updating order...');

            // Step 4: Update order with payment info
            await orderService.updateOrder(order.id, {
              paymentStatus: "paid",
              paymentMethod: "razorpay",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            console.log('✅ Order confirmed! Awaiting manual fulfillment.');
            // Step 6: Clear cart
            if (!orderData.isBuyNow) {
              console.log('🧹 Clearing cart...');
              if (session?.user) {
                await cartService.clearCart();
              }
              useCartStore.getState().clear();
            }

            // Step 7: Redirect to order page
            console.log('🎉 Redirecting to order page...');
            router.push(`/order/${order.id}`);

          } catch (error) {
            console.error("Failed to process after payment:", error);
            setError(
              "Payment succeeded but post-payment processing failed. Your order is saved. Order ID: " + order.code
            );
          }
        },
        onFailure: async (error) => {
          console.error("❌ Payment failed:", error);
          await orderService.updateOrder(order.id, {
            paymentStatus: "failed",
          });
          setError(
            error?.error?.description || "Payment failed. Please try again."
          );
          setIsProcessing(false);
        },
        onDismiss: () => {
          console.log('⚠️  Payment modal dismissed');
          setIsProcessing(false);
        },
      });

      return order;

    } catch (error) {
      console.error("Checkout error:", error);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes("Too many")) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : "Checkout failed");
      }

      setIsProcessing(false);
      throw error;
    }
  };

  return {
    processPayment,
    processPaymentWithShipments,
    isProcessing,
    error,
    setError,
  };
}