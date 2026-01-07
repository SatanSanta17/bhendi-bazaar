/**
 * Client-side domain types for Order
 *
 * These types are used on the client-side (components, hooks).
 * They mirror the API response structure and are used for type safety.
 */

import type { CartItem, CartTotals } from "./cart";
import type { OrderShippingInfo } from "./shipping";

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

export interface Order {
  id: string;
  code: string;
  userId?: string; // Optional for guest orders
  items: CartItem[];
  totals: CartTotals;
  status: OrderStatus;
  address: OrderAddress;
  shipping: OrderShippingInfo;
  notes?: string;
  placedAt: string;
  estimatedDelivery?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}
