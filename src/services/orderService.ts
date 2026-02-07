/**
 * Client-side Order Service
 *
 * This service handles all order-related API calls from the client side.
 * UI components should use this service instead of making direct fetch calls.
 */

import type { Order } from "@/domain/order";
import type {
  OrderAddress,
} from "@/domain/order";
import type { CartItem, CartTotals } from "@/domain/cart";
import type { ShippingGroup } from "@/domain/shipping";

export interface CreateOrderInput {
  items: CartItem[];
  totals: CartTotals;
  address: OrderAddress;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface CreateOrderWithShipmentsInput {
  shippingGroups: ShippingGroup[];
  totals: {
    itemsTotal: number;
    shippingTotal: number;
    discount: number;
    grandTotal: number;
  };
  address: OrderAddress;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface UpdateOrderInput {
  status?: "processing" | "packed" | "shipped" | "delivered";
  paymentMethod?: string;
  paymentStatus?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

class OrderService {
  /**
   * Get all orders for the authenticated user
   */
  async getOrders(): Promise<Order[]> {
    const response = await fetch("/api/orders", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - please sign in");
      }
      throw new Error("Failed to fetch orders");
    }

    return response.json();
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await fetch(`/api/orders/${orderId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Order not found");
      }
      if (response.status === 403) {
        throw new Error("You don't have permission to view this order");
      }
      throw new Error("Failed to fetch order");
    }

    return response.json();
  }

  /**
   * Lookup order by code (for guest orders)
   */
  async lookupOrderByCode(code: string): Promise<Order> {
    const response = await fetch("/api/orders/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (response.status === 429) {
      const error = await response.json();
      throw new Error(
        error.error || "Too many requests. Please try again later."
      );
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Order not found");
      }
      throw new Error("Failed to lookup order");
    }

    return response.json();
  }

  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (response.status === 429) {
      const error = await response.json();
      throw new Error(
        error.error || "Too many requests. Please try again later."
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to create order. Please try again."
      );
    }

    return response.json();
  }

  /**
   * Update an existing order
   */
  async updateOrder(
    orderId: string,
    input: UpdateOrderInput
  ): Promise<Order> {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("You don't have permission to update this order");
      }
      if (response.status === 404) {
        throw new Error("Order not found");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update order");
    }

    return response.json();
  }

  /**
   * Create a new order with multiple shipments (NEW)
   */
  async createOrderWithShipments(
    input: CreateOrderWithShipmentsInput
  ): Promise<Order> {
    const response = await fetch("/api/orders/create-with-shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (response.status === 429) {
      const error = await response.json();
      throw new Error(
        error.error || "Too many requests. Please try again later."
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to create order. Please try again."
      );
    }

    return response.json();
  }

  /**
   * Trigger automated order fulfillment (ADMIN USE ONLY)
   * 
   * ⚠️ NOT USED IN CURRENT CHECKOUT FLOW
   * Current implementation uses manual fulfillment via Shiprocket website.
   * 
   * This method is kept for future automation or admin-triggered fulfillment.
   * When called, it will:
   * - Creates shipments with providers via API
   * - Generates AWB numbers automatically
   * - Schedules pickups automatically
   * 
   * @deprecated Use manual tracking updates via /api/admin/shipments/[id]/tracking
   */
  async fulfillOrder(orderId: string): Promise<void> {
    const response = await fetch(`/api/orders/${orderId}/fulfill`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to fulfill order"
      );
    }
  }
}

// Export a singleton instance
export const orderService = new OrderService();

