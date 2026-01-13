/**
 * Core Shipping Domain Types
 * 
 * These types define the core data structures used throughout the shipping module.
 * They represent addresses, packages, rates, shipments, and tracking information.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================


export type ShipmentStatus =
  | "pending" // Shipment not yet created
  | "created" // Shipment created, awaiting pickup
  | "picked_up" // Picked up from warehouse
  | "in_transit" // In transit to destination
  | "out_for_delivery" // Out for delivery
  | "delivered" // Successfully delivered
  | "failed" // Delivery failed
  | "returned" // Returned to origin
  | "cancelled"; // Shipment cancelled

export type ShippingEventType =
  | "rate_check"
  | "shipment_created"
  | "status_update"
  | "label_generated"
  | "cancellation"
  | "webhook_received";

export type EventStatus = "success" | "failed" | "pending";

// ============================================================================
// ADDRESS & PACKAGE
// ============================================================================

export interface ShippingAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface PackageDimensions {
  length: number; // cm
  breadth: number; // cm
  height: number; // cm
}

export interface ShippingPackage {
  weight: number; // kg
  dimensions?: PackageDimensions;
  declaredValue: number; // INR
  description?: string; // "Clothing items"
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
}

// ============================================================================
// RATE CALCULATION
// ============================================================================

export interface ShippingRateRequest {
  fromPincode: string; // Warehouse pincode
  toPincode: string; // Customer pincode
  weight: number;
  cod: number; // COD mode (0 or 1)
}

export interface ShippingRate {
  providerId: string;
  providerName: string; // "Shiprocket"
  courierName: string; // "BlueDart Surface"
  courierCode?: string; // Provider's internal courier code
  rate: number; // Shipping cost in INR
  estimatedDays: number; // Estimated delivery days
  mode: String;
  available: boolean;
  features?: {
    insurance?: boolean;
    cod?: boolean;
    tracking?: boolean;
    rto?: boolean; // Return to origin
  };
  metadata?: Record<string, any>; // Provider-specific data
}

// ============================================================================
// SHIPMENT CREATION
// ============================================================================

export interface CreateShipmentRequest {
  orderId: string;
  orderCode: string; // BB-1001
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  package: ShippingPackage;
  mode: String;
  codAmount?: number;
  selectedRate?: ShippingRate; // Pre-selected rate from rate check
  preferences?: {
    preferredDeliveryDate?: Date;
    specialInstructions?: string;
    pickupTime?: string;
  };
}

export interface Shipment {
  providerId: string;
  providerShipmentId?: string; // Provider's internal shipment ID
  trackingNumber: string; // AWB number
  courierName: string;
  courierCode?: string;
  trackingUrl: string;
  estimatedDelivery?: Date;
  labels?: {
    shippingLabel?: string; // PDF URL or base64
    invoice?: string; // PDF URL or base64
    manifest?: string; // PDF URL or base64
  };
  pickupScheduled?: {
    pickupId?: string;
    pickupDate?: Date;
    pickupTime?: string;
  };
  metadata: Record<string, any>;
}

// ============================================================================
// TRACKING
// ============================================================================

export interface TrackingStatus {
  status: ShipmentStatus; // Normalized status
  providerStatus: string; // Original provider status
  location?: string; // Current location
  timestamp: Date;
  description?: string;
  remarks?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  courierName: string;
  currentStatus: TrackingStatus;
  history: TrackingStatus[];
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  recipientName?: string;
  recipientSignature?: string; // URL to signature image
}

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

export interface ProviderConfig {
  id: string;
  code: string; // 'shiprocket', 'delhivery'
  name: string; // 'Shiprocket', 'Delhivery'
  priority: number; // Higher = preferred
  supportedModes: String[];
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

export interface ShippingEventLog {
  orderId: string;
  providerId: string;
  eventType: ShippingEventType;
  status: EventStatus;
  request?: Record<string, any>;
  response?: Record<string, any>;
  errorMessage?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// WEBHOOK
// ============================================================================

export interface WebhookEvent {
  orderId?: string;
  trackingNumber: string;
  status: TrackingStatus;
  rawPayload?: any;
}

// ============================================================================
// RATE CACHING
// ============================================================================

export interface CachedRate {
  providerId: string;
  fromPincode: string;
  toPincode: string;
  weight: number;
  mode: string;
  rate: number;
  courierName: string;
  estimatedDays: number;
  metadata?: any;
  expiresAt: Date;
}

