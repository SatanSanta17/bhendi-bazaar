/**
 * Shiprocket API Types
 * 
 * Type definitions for Shiprocket API v2 requests and responses.
 * Based on official Shiprocket API documentation: https://apidocs.shiprocket.in
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface ShiprocketAuthRequest {
  email: string;
  password: string;
}

export interface ShiprocketAuthResponse {
  token: string;
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
}

// ============================================================================
// SERVICEABILITY
// ============================================================================

export interface ShiprocketServiceabilityRequest {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number;  // in kg
  cod: 0 | 1;     // 0 = prepaid, 1 = COD
}

export interface ShiprocketCourierServiceability {
  id: number;
  courier_company_id: number;
  courier_name: string;
  city: string;
  mode: string;  // "Surface", "Air"
  rate: number;
  etd: string;  // "2-3 Days", "1-2 Days"
  estimated_delivery_days: string;
  cod: number;
  freight_charge: number;
  rating: number;
  pickup_availability: string;
  delivery_performance: number;
  suppression_dates: string | null;
  min_weight: number;
  blocked: number;
  is_custom_rate: number;
  is_surface: boolean;
  call_before_delivery: string;
  is_hyperlocal: boolean;
}

export interface ShiprocketServiceabilityResponse {
  data: {
    available_courier_companies: ShiprocketCourierServiceability[];
    shiprocket_recommended_courier_id: number;
    child_courier_id: number | null;
    is_recommendation_enabled: boolean;
  };
}

// ============================================================================
// ORDER CREATION
// ============================================================================

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketCreateOrderRequest {
  order_id: string;
  order_date: string;  // YYYY-MM-DD HH:mm
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;  // cm
  breadth: number;  // cm
  height: number;  // cm
  weight: number;  // kg
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  order_code: string;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string | null;
  courier_company_id: number | null;
  courier_name: string | null;
}

// ============================================================================
// AWB ASSIGNMENT
// ============================================================================

export interface ShiprocketAssignAWBRequest {
  shipment_id: number;
  courier_id: number;
}

export interface ShiprocketAssignAWBResponse {
  awb_assign_status: number;
  response: {
    data: {
      awb_code: string;
      courier_company_id: number;
      courier_name: string;
      shipment_id: number;
      assigned_date_time: string;
      applied_weight: number;
      pickup_scheduled_date: string | null;
      routing_code: string | null;
      rto_routing_code: string | null;
      invoice_no: string | null;
      child_courier_id: number | null;
      child_courier_name: string | null;
    };
  };
}

// ============================================================================
// TRACKING
// ============================================================================

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  sr_status: string;
  sr_status_label: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: ShiprocketTrackingActivity[];
    shipment_track_activities: ShiprocketTrackingActivity[];
    track_url: string;
    etd: string;
    qc_response: any;
  };
}

// ============================================================================
// PICKUP SCHEDULING
// ============================================================================

export interface ShiprocketSchedulePickupRequest {
  shipment_id: number[];
  pickup_date: string;  // YYYY-MM-DD
}

export interface ShiprocketSchedulePickupResponse {
  pickup_scheduled_date: string;
  pickup_token_number: string;
  status: number;
  response: string;
}

// ============================================================================
// LABEL GENERATION
// ============================================================================

export interface ShiprocketGenerateLabelRequest {
  shipment_id: number[];
}

export interface ShiprocketGenerateLabelResponse {
  label_url: string;
  label_created: number;
}

// ============================================================================
// MANIFEST
// ============================================================================

export interface ShiprocketGenerateManifestRequest {
  shipment_id: number[];
}

export interface ShiprocketGenerateManifestResponse {
  manifest_url: string;
  status: number;
}

// ============================================================================
// SHIPMENT CANCELLATION
// ============================================================================

export interface ShiprocketCancelShipmentRequest {
  awbs: string[];
}

export interface ShiprocketCancelShipmentResponse {
  message: string;
}

// ============================================================================
// WEBHOOK
// ============================================================================

export interface ShiprocketWebhookPayload {
  awb: string;
  courier_company_id: number;
  courier_name: string;
  current_status: string;
  delivered_date: string | null;
  delivered_to: string | null;
  destination: string;
  etd: string;
  order_id: string;
  pickup_date: string | null;
  scans: Array<{
    date: string;
    activity: string;
    location: string;
  }>;
  shipment_id: number;
  shipment_status: string;
  shipment_status_id: number;
  origin: string;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ShiprocketErrorResponse {
  status_code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// SHIPROCKET STATUS CODES
// ============================================================================

export enum ShiprocketStatusCode {
  NEW = 1,
  PICKED_UP = 2,
  IN_TRANSIT = 3,
  OUT_FOR_DELIVERY = 4,
  DELIVERED = 5,
  CANCELLED = 6,
  RTO_INITIATED = 7,
  RTO_IN_TRANSIT = 8,
  RTO_DELIVERED = 9,
  LOST = 10,
  DAMAGED = 11,
  PICKUP_PENDING = 12,
  PICKUP_SCHEDULED = 13,
  MANIFESTED = 14,
  NOT_PICKED_UP = 15,
  PICKUP_EXCEPTION = 16,
  UNDELIVERED = 17,
  DELAYED = 18,
  PARTIAL_DELIVERED = 19,
  DESTROYED = 20,
  CONTACT_CUSTOMER_CARE = 21,
  OUT_FOR_PICKUP = 22,
  SHIPMENT_BOOKED = 23,
}
