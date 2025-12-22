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
} from "@/server/domain/order";

/**
 * Helper to generate order code
 */
function generateOrderCode(count: number): string {
  const base = 1000 + count;
  return `BB-${base}`;
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
    };
  }

  /**
   * Create a new order
   */
  async create(input: CreateOrderInput): Promise<ServerOrder> {
    // Get the count of orders to generate the next order code
    const orderCount = await prisma.order.count();
    const code = generateOrderCode(orderCount);

    const order = await prisma.order.create({
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
        estimatedDelivery: calculateEstimatedDelivery(),
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
