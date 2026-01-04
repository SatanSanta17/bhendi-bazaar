/**
 * Server-side domain types for Order
 *
 * These types are used exclusively on the server-side (services, repositories).
 * They mirror the database schema and contain server-specific logic.
 */

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered";

export type PaymentMethod = "razorpay";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderAddress {
  fullName: string;
  mobile: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
  selectedVariant?: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export interface ServerOrder {
  id: string;
  code: string;
  userId?: string; // Optional for guest orders
  items: OrderItem[];
  totals: OrderTotals;
  status: OrderStatus;
  address: OrderAddress;
  notes?: string;
  placedAt: string;
  estimatedDelivery?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}

export interface CreateOrderInput {
  userId?: string; // Optional for guest orders
  items: OrderItem[];
  totals: OrderTotals;
  address: OrderAddress;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}
