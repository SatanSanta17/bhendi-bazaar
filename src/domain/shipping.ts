/**
 * Client-side Shipping Domain Types
 * 
 * These types are used on the client-side (components, hooks, API responses).
 * They represent what customers see and interact with in the UI.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================


export type ShipmentStatus =
  | "pending"
  | "created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

// ============================================================================
// SHIPPING RATE (Checkout)
// ============================================================================

/**
 * Shipping rate option shown at checkout
 */
export interface ShippingRate {
  providerId: string;
  providerName: string; // "Shiprocket"
  courierName: string; // "BlueDart Surface"
  rate: number; // ₹85.50
  estimatedDays: number; // 3 days
  mode: String;
  available: boolean;
  features?: {
    insurance?: boolean;
    cod?: boolean;
    tracking?: boolean;
  };
}

/**
 * Request to get shipping rates
 */
export interface GetShippingRatesRequest {
  pincode: string;
  weight?: number; // Optional, calculated from cart
  mode: String;
  codAmount?: number; // For COD orders
}

/**
 * Response with available shipping rates
 */
export interface GetShippingRatesResponse {
  rates: ShippingRate[];
  defaultRate?: ShippingRate;  // Pre-selected based on strategy
  fromPincode: string;          // Warehouse pincode
  toPincode: string;            // Customer pincode
}

// ============================================================================
// TRACKING (Customer View)
// ============================================================================

/**
 * Single tracking update
 */
export interface TrackingUpdate {
  status: ShipmentStatus;
  location?: string;        // "Mumbai, Maharashtra"
  timestamp: string;        // ISO date string
  description?: string;     // "Package picked up"
}

/**
 * Complete tracking information
 */
export interface ShipmentTracking {
  trackingNumber: string;
  courierName: string;
  trackingUrl?: string;       // Direct link to courier tracking
  currentStatus: TrackingUpdate;
  history: TrackingUpdate[];  // Timeline of updates
  estimatedDelivery?: string; // ISO date string
  deliveredAt?: string;       // ISO date string
}

// ============================================================================
// ORDER SHIPPING INFO
// ============================================================================

/**
 * Shipping information attached to an order
 */
export interface OrderShippingInfo {
  providerId?: string;
  providerName?: string;
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  shippingCost: number;
  shipmentStatus?: ShipmentStatus;
  lastStatusUpdate?: string;  // ISO date string
  deliveredAt?: string;       // ISO date string
}

// ============================================================================
// SERVICEABILITY CHECK
// ============================================================================

/**
 * Check if delivery is available to a pincode
 */
export interface ServiceabilityCheckRequest {
  fromPincode: string;
  toPincode: string;
}

/**
 * Serviceability check response
 */
export interface ServiceabilityResponse {
  success: boolean;
  serviceable: boolean;
  providers: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  pincode: string;
  message: string;
}

/**
 * Tracking information
 */
export interface TrackingInfo {
  success: boolean;
  trackingNumber: string;
  courierName: string;
  currentStatus: string;
  statusDate?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  trackingUrl?: string;
  history: Array<{
    status: string;
    location?: string;
    timestamp: string;
    description?: string;
  }>;
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Status display configuration for UI
 */
export interface StatusDisplay {
  label: string;            // "Out for Delivery"
  color: string;            // "blue", "green", "red"
  icon?: string;            // Icon name
  description?: string;     // Helpful text for customer
}

/**
 * Get status display info for UI
 */
export function getStatusDisplay(status: ShipmentStatus): StatusDisplay {
  const displays: Record<ShipmentStatus, StatusDisplay> = {
    pending: {
      label: "Pending",
      color: "yellow",
      description: "Order is being processed",
    },
    created: {
      label: "Label Created",
      color: "blue",
      description: "Shipping label has been created",
    },
    picked_up: {
      label: "Picked Up",
      color: "blue",
      description: "Package picked up from warehouse",
    },
    in_transit: {
      label: "In Transit",
      color: "purple",
      description: "Package is on the way",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      color: "indigo",
      description: "Package is out for delivery today",
    },
    delivered: {
      label: "Delivered",
      color: "green",
      description: "Package has been delivered",
    },
    failed: {
      label: "Delivery Failed",
      color: "red",
      description: "Delivery attempt failed",
    },
    returned: {
      label: "Returned",
      color: "orange",
      description: "Package returned to sender",
    },
    cancelled: {
      label: "Cancelled",
      color: "gray",
      description: "Shipment was cancelled",
    },
  };

  return displays[status] || displays.pending;
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(cost: number): string {
  if (cost === 0) return "FREE";
  return `₹${cost.toFixed(2)}`;
}

/**
 * Format estimated delivery
 */
export function formatEstimatedDelivery(days: number): string {
  if (days === 0) return "Same day";
  if (days === 1) return "Tomorrow";
  if (days === 2) return "In 2 days";
  return `In ${days} days`;
}

/**
 * Check if status is final
 */
export function isTerminalStatus(status: ShipmentStatus): boolean {
  return ["delivered", "failed", "returned", "cancelled"].includes(status);
}

