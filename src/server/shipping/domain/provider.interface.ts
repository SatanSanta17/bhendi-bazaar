/**
 * IShippingProvider Interface
 * 
 * This interface defines the contract that all shipping providers must implement.
 * It ensures consistent behavior across different providers (Shiprocket, Delhivery, etc.)
 */

import type {
  ShippingRateRequest,
  ShippingRate,
  CreateShipmentRequest,
  Shipment,
  TrackingInfo,
  ProviderConfig,
  WebhookEvent,
} from "./shipping.types";

export interface IShippingProvider {
  // ============================================================================
  // IDENTIFICATION
  // ============================================================================

  /**
   * Get unique provider identifier
   * @returns Provider code (e.g., 'shiprocket', 'delhivery')
   */
  getProviderId(): string;

  /**
   * Get human-readable provider name
   * @returns Provider name (e.g., 'Shiprocket', 'Delhivery')
   */
  getProviderName(): string;

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Initialize provider with configuration
   * Called once when provider is loaded
   * @param config Provider configuration including API credentials
   */
  initialize(config: ProviderConfig): Promise<void>;

  // ============================================================================
  // SERVICEABILITY
  // ============================================================================

  /**
   * Check if provider can deliver to a pincode
   * @param pincode Delivery pincode to check
   * @returns true if serviceable, false otherwise
   */
  checkServiceability(pincode: string): Promise<boolean>;

  // ============================================================================
  // RATE CALCULATION
  // ============================================================================

  /**
   * Get available shipping rates
   * May return multiple rates for different courier services
   * @param request Rate calculation parameters
   * @returns Array of available shipping rates
   */
  getRates(request: ShippingRateRequest): Promise<ShippingRate[]>;

  // ============================================================================
  // SHIPMENT CREATION
  // ============================================================================

  /**
   * Create a new shipment and get tracking number
   * @param request Shipment creation parameters
   * @returns Shipment details including AWB number and labels
   */
  createShipment(request: CreateShipmentRequest): Promise<Shipment>;

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Get current tracking status for a shipment
   * @param trackingNumber AWB number to track
   * @returns Complete tracking information with history
   */
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;

  // ============================================================================
  // CANCELLATION
  // ============================================================================

  /**
   * Cancel a shipment (before pickup)
   * @param trackingNumber AWB number to cancel
   * @returns true if cancelled successfully
   */
  cancelShipment(trackingNumber: string): Promise<boolean>;

  // ============================================================================
  // OPTIONAL: ADVANCED FEATURES
  // ============================================================================

  /**
   * Schedule pickup for shipments (optional)
   * @param params Pickup scheduling parameters
   */
  schedulePickup?(params: {
    trackingNumbers: string[];
    pickupDate: Date;
    pickupTime?: string;
  }): Promise<{ pickupId: string }>;

  /**
   * Generate or download shipping label (optional)
   * @param trackingNumber AWB number
   */
  generateLabel?(trackingNumber: string): Promise<{ labelUrl: string }>;

  /**
   * Get invoice/manifest (optional)
   * @param trackingNumber AWB number
   */
  getInvoice?(trackingNumber: string): Promise<{ invoiceUrl: string }>;

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Handle webhook callback from provider
   * @param payload Raw webhook payload from provider
   * @returns Normalized webhook event
   */
  handleWebhook(payload: any): Promise<WebhookEvent>;

  /**
   * Validate webhook signature (optional but recommended)
   * @param payload Webhook payload
   * @param signature Signature from webhook headers
   * @returns true if signature is valid
   */
  validateWebhook?(payload: any, signature: string): boolean;
}

/**
 * Provider Factory Type
 * Used to create provider instances
 */
export type ProviderFactory = (config: ProviderConfig) => IShippingProvider;

