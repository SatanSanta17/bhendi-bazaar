/**
 * Server-side domain types for Order
 *
 * These types are used exclusively on the server-side (services, repositories).
 * They mirror the database schema and contain server-specific logic.
 */

import { Order } from "@prisma/client";

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered" | "pending_payment" | "confirmed" | "partially_fulfilled" | "fulfillment_failed";

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

export interface CreateOrderInput {
  userId?: string; // Optional for guest orders
  items: OrderItem[];
  itemsTotal: number;
  shippingTotal: number;
  discount: number;
  grandTotal: number;
  address: OrderAddress;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  status?: OrderStatus;
  shipments: Shipment[];
}

interface Shipment {
  id: string;
  code: string;
  orderId: string;
  items: OrderItem[];
  sellerId: string;
  fromPincode: string;
  fromCity: string;
  fromState: string;
  shippingCost: number;
  shippingProviderId?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  estimatedDelivery?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}

// ============================================
// NEW: Multi-Shipment Order Types
// ============================================

export interface ShipmentItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

export interface ShippingGroupInput {
  // Group identifier
  groupId: string;

  // Origin details
  sellerId: string;
  sellerName: string;
  fromPincode: string;
  fromCity: string;
  fromState: string;

  // Items in this group
  items: ShipmentItem[];

  // Shipping details
  totalWeight: number;
  itemsTotal: number;
  selectedRate: {
    providerId: string;
    providerName: string;
    courierName: string;
    courierCode?: string;
    rate: number;
    estimatedDays: number;
    mode: string;
    etd?: string;
  };
}

export interface CreateOrderWithShipmentsInput {
  userId?: string;
  address: OrderAddress;
  shippingGroups: ShippingGroupInput[];
  totals: {
    itemsTotal: number;
    shippingTotal: number;
    discount: number;
    grandTotal: number;
  };
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}

export interface ServerShipment {
  id: string;
  code: string;
  orderId: string;
  items: ShipmentItem[];
  sellerId: string;
  fromPincode: string;
  fromCity: string;
  fromState: string;
  shippingCost: number;
  shippingProviderId?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface ServerOrderWithShipments extends Omit<Order, 'items' | 'shippingCost' | 'courierName' | 'trackingNumber' | 'totals'> {
  itemsTotal: number;
  shippingTotal: number;
  discount: number;
  grandTotal: number;
  shipments: ServerShipment[];
}
