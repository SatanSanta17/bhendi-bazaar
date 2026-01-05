/**
 * Server-side Order Service
 *
 * This service encapsulates all business logic related to orders.
 * It acts as an intermediary between API routes and the repository layer.
 */

import { orderRepository } from "@/server/repositories/orderRepository";
import type {
  ServerOrder,
  CreateOrderInput,
  UpdateOrderInput,
} from "@/server/domain/order";

export class OrderService {
  /**
   * Get all orders for a user
   */
  async getOrdersByUserId(userId: string): Promise<ServerOrder[]> {
    return await orderRepository.listByUserId(userId);
  }

  /**
   * Get a single order by ID
   * Validates that the order belongs to the user (if userId provided)
   */
  async getOrderById(
    orderId: string,
    userId?: string
  ): Promise<ServerOrder | null> {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      return null;
    }

    // If userId is provided, verify ownership
    if (userId && order.userId && order.userId !== userId) {
      throw new Error("Unauthorized: Order does not belong to user");
    }

    return order;
  }

  /**
   * Lookup order by code (for guest orders)
   * This allows guests to track their order using the order code
   */
  async lookupOrderByCode(code: string): Promise<ServerOrder | null> {
    return await orderRepository.findByCode(code);
  }

  /**
   * Create a new order with validation
   */
  async createOrder(input: CreateOrderInput): Promise<ServerOrder> {
    // Validate input
    this.validateCreateOrderInput(input);

    // Create the order
    const order = await orderRepository.create(input);

    return order;
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    orderId: string,
    input: UpdateOrderInput,
    userId?: string
  ): Promise<ServerOrder> {
    // First, get the order to verify ownership
    const existingOrder = await this.getOrderById(orderId, userId);

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // Check if payment status is changing to "paid"
    const isPaymentCompleted =
      input.paymentStatus === "paid" && existingOrder.paymentStatus !== "paid";

    // Update the order
    const updated = await orderRepository.update(orderId, input);

    if (!updated) {
      throw new Error("Failed to update order");
    }

    // Send purchase confirmation email when payment is completed
    if (isPaymentCompleted && updated.address.email) {
      const { emailService } = await import("./emailService");

      emailService
        .sendPurchaseConfirmationEmail(updated, updated.address.email)
        .catch((error) => {
          console.error("Failed to send purchase confirmation email:", error);
          // Don't throw - email failure shouldn't block order update
        });
    }

    return updated;
  }

  /**
   * Delete an order (admin only)
   */
  async deleteOrder(orderId: string): Promise<void> {
    await orderRepository.delete(orderId);
  }

  /**
   * Validate order creation input
   */
  private validateCreateOrderInput(input: CreateOrderInput): void {
    // Validate items
    if (!input.items || input.items.length === 0) {
      throw new Error("Order must contain at least one item");
    }

    for (const item of input.items) {
      if (!item.productId || !item.productName || !item.thumbnail) {
        throw new Error("Invalid item data: missing required fields");
      }
      if (item.quantity <= 0) {
        throw new Error("Item quantity must be greater than 0");
      }
      if (item.price < 0) {
        throw new Error("Item price cannot be negative");
      }
    }

    // Validate totals
    if (!input.totals) {
      throw new Error("Order totals are required");
    }
    if (input.totals.total <= 0) {
      throw new Error("Order total must be greater than 0");
    }

    // Validate address
    if (!input.address) {
      throw new Error("Shipping address is required");
    }
    const { fullName, mobile, addressLine1, city, state, pincode, country } =
      input.address;
    if (
      !fullName ||
      !mobile ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode ||
      !country
    ) {
      throw new Error("Address is missing required fields");
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobile)) {
      throw new Error("Phone number must be 10 digits");
    }

    // Validate postal code (basic validation)
    const postalCodeRegex = /^\d{6}$/;
    if (!postalCodeRegex.test(pincode)) {
      throw new Error("Postal code must be 6 digits");
    }
  }
}

export const orderService = new OrderService();

