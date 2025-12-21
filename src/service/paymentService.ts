import { paymentGateway } from "@/server/repositories/razorpayGateway";
import { orderRepository } from "@/server/repositories/orderRepository";
import type { CreatePaymentOrderInput } from "@/domain/payment";
import type { PaymentMethod } from "@/domain/order";

export class PaymentService {
  /**
   * Creates a payment order and links it to a local order
   */
  async initiatePayment(input: CreatePaymentOrderInput) {
    // Verify order exists
    const order = await orderRepository.findById(input.localOrderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check if already paid
    if (order.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }

    // Create gateway order
    const gatewayOrder = await paymentGateway.createOrder(input);

    // Update local order with gateway info
    await orderRepository.update(order.id, {
      paymentMethod: gatewayOrder.provider as PaymentMethod,
      paymentStatus: "pending",
    });

    return {
      order,
      gatewayOrder,
    };
  }

  /**
   * Completes payment after successful gateway callback
   */
  async completePayment(orderId: string, paymentId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await orderRepository.update(orderId, {
      paymentStatus: "paid",
      paymentId,
    });

    // You could trigger other side effects here:
    // - Send confirmation email
    // - Update inventory
    // - Notify fulfillment system
    // - Log analytics event

    return order;
  }
}

export const paymentService = new PaymentService();