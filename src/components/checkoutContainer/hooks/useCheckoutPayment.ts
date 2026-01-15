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
  PaymentMethod,
  PaymentStatus,
} from "@/domain/order";
import type { CartItem, CartTotals } from "@/domain/cart";

interface ProcessPaymentInput {
  items: CartItem[];
  totals: CartTotals;
  address: OrderAddress;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
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

  return {
    processPayment,
    isProcessing,
    error,
    setError,
  };
}