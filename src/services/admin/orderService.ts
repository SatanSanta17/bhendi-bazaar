/**
 * Admin Order Service (Client-side)
 * Handles API calls for order management
 */

import type {
  OrderListFilters,
  OrderListResult,
} from "@/domain/admin";
import type { Order } from "@/domain/order";
class AdminOrderService {
  /**
   * Get paginated list of orders
   */
  async getOrders(filters: OrderListFilters = {}): Promise<OrderListResult> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.paymentStatus)
      params.append("paymentStatus", filters.paymentStatus);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.minAmount) params.append("minAmount", String(filters.minAmount));
    if (filters.maxAmount) params.append("maxAmount", String(filters.maxAmount));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const response = await fetch(`/api/admin/orders?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch orders");
    }

    return response.json();
  }

  /**
   * Get single order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await fetch(`/api/admin/orders/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch order");
    }

    return response.json();
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    data: { status?: string; notes?: string; estimatedDelivery?: string }
  ): Promise<Order> {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update order");
    }

    return response.json();
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(
    orderIds: string[],
    status: string
  ): Promise<{ success: boolean; count: number }> {
    const response = await fetch(`/api/admin/orders/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds, status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to bulk update orders");
    }

    return response.json();
  }
}

export const adminOrderService = new AdminOrderService();


