/**
 * Server-side Order Repository
 *
 * This repository handles all database operations for orders.
 * It uses Prisma to interact with the PostgreSQL database.
 */

import { prisma } from "@/lib/prisma";
import type {
  ServerOrder,
  CreateOrderInput,
  UpdateOrderInput,
  OrderItem,
  OrderTotals,
  OrderAddress,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../domain/order";

/**
 * Helper to generate order code
 */
function generateOrderCode(): string {
  const code = `BB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  return code;
}

/**
 * Helper to calculate estimated delivery date
 */
function calculateEstimatedDelivery(): string {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days from now
  return deliveryDate.toISOString();
}

/**
 * Normalize JSON fields from database
 */
function normalizeItems(items: unknown): OrderItem[] {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items as OrderItem[];
  }
  return [];
}

function normalizeTotals(totals: unknown): OrderTotals {
  if (totals && typeof totals === "object") {
    return totals as OrderTotals;
  }
  return { subtotal: 0, discount: 0, total: 0 };
}

function normalizeAddress(address: unknown): OrderAddress {
  if (address && typeof address === "object") {
    return address as OrderAddress;
  }
  throw new Error("Invalid address data");
}

export class OrderRepository {
  /**
   * List all orders for a user
   */
  async listByUserId(userId: string): Promise<ServerOrder[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => ({
      id: order.id,
      code: order.code,
      userId: order.userId ?? undefined,
      items: normalizeItems(order.items),
      totals: normalizeTotals(order.totals),
      status: order.status as OrderStatus,
      address: normalizeAddress(order.address),
      notes: order.notes ?? undefined,
      placedAt: order.createdAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
      paymentMethod: order.paymentMethod as PaymentMethod | undefined,
      paymentStatus: order.paymentStatus as PaymentStatus | undefined,
      paymentId: order.paymentId ?? undefined,
      shippingProviderId: order.shippingProviderId ?? undefined,
      shippingCost: order.shippingCost,
      courierName: order.courierName ?? undefined,
      trackingNumber: order.trackingNumber ?? undefined,
      trackingUrl: order.trackingUrl ?? undefined,
      packageWeight: order.packageWeight ?? undefined,
    }));
  }

  /**
   * Find order by ID
   */
  async findById(orderId: string): Promise<ServerOrder | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      code: order.code,
      userId: order.userId ?? undefined,
      items: normalizeItems(order.items),
      totals: normalizeTotals(order.totals),
      status: order.status as OrderStatus,
      address: normalizeAddress(order.address),
      notes: order.notes ?? undefined,
      placedAt: order.createdAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
      paymentMethod: order.paymentMethod as PaymentMethod | undefined,
      paymentStatus: order.paymentStatus as PaymentStatus | undefined,
      paymentId: order.paymentId ?? undefined,
    };
  }

  /**
   * Find order by code (for guest lookup)
   */
  async findByCode(code: string): Promise<ServerOrder | null> {
    const order = await prisma.order.findUnique({
      where: { code },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      code: order.code,
      userId: order.userId ?? undefined,
      items: normalizeItems(order.items),
      totals: normalizeTotals(order.totals),
      status: order.status as OrderStatus,
      address: normalizeAddress(order.address),
      notes: order.notes ?? undefined,
      placedAt: order.createdAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
      paymentMethod: order.paymentMethod as PaymentMethod | undefined,
      paymentStatus: order.paymentStatus as PaymentStatus | undefined,
      paymentId: order.paymentId ?? undefined,
      shippingProviderId: order.shippingProviderId ?? undefined,
      shippingCost: order.shippingCost,
      courierName: order.courierName ?? undefined,
      trackingNumber: order.trackingNumber ?? undefined,
      trackingUrl: order.trackingUrl ?? undefined,
      packageWeight: order.packageWeight ?? undefined,
    };
  }

  /**
   * Create a new order with automatic stock deduction
   */
  async create(input: CreateOrderInput): Promise<ServerOrder> {
    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Validate and check stock availability for all items
      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // Step 2: Generate code
      const code = generateOrderCode();

      // Step 3: Calculate estimated delivery
      const estimatedDelivery = input.shipping?.estimatedDays
        ? new Date(Date.now() + input.shipping.estimatedDays * 24 * 60 * 60 * 1000)
        : calculateEstimatedDelivery();

      // Step 4: Create the order
      const order = await tx.order.create({
        data: {
          code,
          userId: input.userId ?? null,
          items: input.items as any,
          totals: input.totals as any,
          status: "processing",
          address: input.address as any,
          notes: input.notes ?? null,
          paymentMethod: input.paymentMethod ?? null,
          paymentStatus: input.paymentStatus ?? "pending",
          paymentId: input.paymentId ?? null,
          estimatedDelivery,
          // Shipping fields
          shippingProviderId: input.shipping?.providerId ?? null,
          shippingCost: input.shipping?.shippingCost ?? 0,
          courierName: input.shipping?.courierName ?? null,
          packageWeight: input.shipping?.packageWeight ?? null,
        },
      });

      // Step 5: Decrement stock for each item
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    // Return normalized order
    return {
      id: result.id,
      code: result.code,
      userId: result.userId ?? undefined,
      items: normalizeItems(result.items),
      totals: normalizeTotals(result.totals),
      status: result.status as OrderStatus,
      address: normalizeAddress(result.address),
      notes: result.notes ?? undefined,
      placedAt: result.createdAt.toISOString(),
      estimatedDelivery: result.estimatedDelivery?.toISOString(),
      paymentMethod: result.paymentMethod as PaymentMethod | undefined,
      paymentStatus: result.paymentStatus as PaymentStatus | undefined,
      paymentId: result.paymentId ?? undefined,
      shippingProviderId: result.shippingProviderId ?? undefined,
      shippingCost: result.shippingCost,
      courierName: result.courierName ?? undefined,
      trackingNumber: result.trackingNumber ?? undefined,
      trackingUrl: result.trackingUrl ?? undefined,
      packageWeight: result.packageWeight ?? undefined,
    };
  }

  /**
   * Update an existing order
   */
  async update(
    orderId: string,
    input: UpdateOrderInput
  ): Promise<ServerOrder | null> {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
        ...(input.paymentStatus && { paymentStatus: input.paymentStatus }),
        ...(input.paymentId && { paymentId: input.paymentId }),
      },
    });

    return {
      id: order.id,
      code: order.code,
      userId: order.userId ?? undefined,
      items: normalizeItems(order.items),
      totals: normalizeTotals(order.totals),
      status: order.status as OrderStatus,
      address: normalizeAddress(order.address),
      notes: order.notes ?? undefined,
      placedAt: order.createdAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString(),
      paymentMethod: order.paymentMethod as PaymentMethod | undefined,
      paymentStatus: order.paymentStatus as PaymentStatus | undefined,
      paymentId: order.paymentId ?? undefined,
      shippingProviderId: order.shippingProviderId ?? undefined,
      shippingCost: order.shippingCost,
      courierName: order.courierName ?? undefined,
      trackingNumber: order.trackingNumber ?? undefined,
      trackingUrl: order.trackingUrl ?? undefined,
      packageWeight: order.packageWeight ?? undefined,
    };
  }

  /**
   * Cancel an order and restore stock
   */
  async cancel(orderId: string): Promise<ServerOrder | null> {
    const result = await prisma.$transaction(async (tx) => {
      // Get order to restore stock
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      // Only restore stock if order is in a cancellable state
      const cancellableStatuses = ["processing", "packed"];
      if (!cancellableStatuses.includes(existingOrder.status)) {
        throw new Error(
          `Cannot cancel order with status: ${existingOrder.status}`
        );
      }

      const items = normalizeItems(existingOrder.items);

      // Update order status to cancelled
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
      });

      // Restore stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return order;
    });

    return {
      id: result.id,
      code: result.code,
      userId: result.userId ?? undefined,
      items: normalizeItems(result.items),
      totals: normalizeTotals(result.totals),
      status: result.status as OrderStatus,
      address: normalizeAddress(result.address),
      notes: result.notes ?? undefined,
      placedAt: result.createdAt.toISOString(),
      estimatedDelivery: result.estimatedDelivery?.toISOString(),
      paymentMethod: result.paymentMethod as PaymentMethod | undefined,
      paymentStatus: result.paymentStatus as PaymentStatus | undefined,
      paymentId: result.paymentId ?? undefined,
    };
  }

  /**
   * Delete an order (admin only)
   */
  async delete(orderId: string): Promise<void> {
    await prisma.order.delete({
      where: { id: orderId },
    });
  }
}

export const orderRepository = new OrderRepository();
