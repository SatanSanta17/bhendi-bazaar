/**
 * Shiprocket Provider Implementation
 * 
 * Complete implementation of Shiprocket shipping provider.
 * Includes all core methods plus Shiprocket-specific features.
 */

import { BaseShippingProvider } from "../base.provider";
import type {
  ShippingRateRequest,
  ShippingRate,
  CreateShipmentRequest,
  Shipment,
  TrackingInfo,
  WebhookEvent,
} from "../../domain";
import type {
  ShiprocketAuthResponse,
  ShiprocketServiceabilityRequest,
  ShiprocketServiceabilityResponse,
  ShiprocketCreateOrderRequest,
  ShiprocketCreateOrderResponse,
  ShiprocketAssignAWBRequest,
  ShiprocketAssignAWBResponse,
  ShiprocketTrackingResponse,
  ShiprocketSchedulePickupRequest,
  ShiprocketSchedulePickupResponse,
  ShiprocketGenerateLabelRequest,
  ShiprocketGenerateLabelResponse,
  ShiprocketGenerateManifestRequest,
  ShiprocketGenerateManifestResponse,
  ShiprocketCancelShipmentRequest,
  ShiprocketWebhookPayload,
} from "./shiprocket.types";
import {
  mapShiprocketRateToShippingRate,
  mapShiprocketAWBToShipment,
  mapShiprocketTrackingToTrackingInfo,
  mapShiprocketStatusToOurs,
} from "./shiprocket.mapper";
import {
  SHIPROCKET_CONFIG,
  SHIPROCKET_ENDPOINTS,
  DEFAULT_PACKAGE_DIMENSIONS,
} from "./shiprocket.config";
import { shippingProviderRepository } from "../../repositories/provider.repository";
import { encryptionService } from "../../utils/encryption";
export class ShiprocketProvider extends BaseShippingProvider {
  private authToken?: string;
  private tokenExpiry?: Date;
  private baseUrl: string = SHIPROCKET_CONFIG.BASE_URL;

  // ============================================================================
  // PROVIDER IDENTIFICATION
  // ============================================================================

  getProviderId(): string {
    return "shiprocket";
  }

  getProviderName(): string {
    return "Shiprocket";
  }

  // ============================================================================
  // INITIALIZATION & AUTHENTICATION
  // ============================================================================

  protected async onInitialize(): Promise<void> {
    // Get base URL from config if provided
    this.baseUrl = this.getConfigValue("baseUrl", SHIPROCKET_CONFIG.BASE_URL);

    // Don't auto-authenticate - check if connected and use stored token
    await this.loadStoredAuth();
  }

  /**
   * Load stored authentication token from database
   */
  private async loadStoredAuth(): Promise<void> {
    const provider = await shippingProviderRepository.getById(this.config.id);

    if (!provider?.isConnected || !provider.authToken) {
      return; // Not connected, will authenticate on-demand
    }

    // Check if token is expired
    if (provider.tokenExpiresAt && new Date() >= provider.tokenExpiresAt) {
      // Token expired, try to refresh
      await this.refreshToken();
      return;
    }

    // Use stored token
    try {
      this.authToken = encryptionService.decrypt(provider.authToken);
      this.tokenExpiry = provider.tokenExpiresAt || undefined;
    } catch (error) {
      console.error(
        "Failed to decrypt stored token, re-authenticating:",
        error
      );
      await this.authenticate();
    }
  }

  /**
   * Refresh token if expired
   */
  private async refreshToken(): Promise<void> {
    // For Shiprocket, we need to re-authenticate with credentials
    await this.authenticate();
  }

  /**
   * Authenticate with Shiprocket (uses stored credentials)
   */
  private async authenticate(): Promise<void> {
    const provider = await shippingProviderRepository.getById(this.config.id);

    if (!provider?.isConnected) {
      throw new Error(
        "Provider account is not connected. Please connect your account in admin panel."
      );
    }

    const accountInfo = provider.accountInfo as any;

    if (!accountInfo?.email || !accountInfo?.password) {
      throw new Error(
        "Provider credentials not found. Please reconnect your account."
      );
    }

    const email = accountInfo.email;
    const password = encryptionService.decrypt(accountInfo.password);

    const response = await fetch(
      `${this.baseUrl}${SHIPROCKET_ENDPOINTS.AUTH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));

      // Update error in database
      await shippingProviderRepository.update(provider.id, {
        authError: error.message || response.statusText,
      });

      throw new Error(
        `Authentication failed: ${error.message || response.statusText}`
      );
    }

    const data: ShiprocketAuthResponse = await response.json();
    this.authToken = data.token;
    this.tokenExpiry = new Date(
      Date.now() + SHIPROCKET_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Update token in database
    await shippingProviderRepository.updateAuthToken(
      provider.id,
      data.token,
      this.tokenExpiry
    );
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  private async ensureAuthenticated(): Promise<void> {
    if (
      !this.authToken ||
      !this.tokenExpiry ||
      new Date() >= this.tokenExpiry
    ) {
      await this.authenticate();
    }
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.authToken}`,
    };
  }

  // ============================================================================
  // CORE METHODS (IShippingProvider interface)
  // ============================================================================

  /**
   * Check if Shiprocket can deliver to a pincode
   */
  async checkServiceability(pincode: string): Promise<boolean> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    if (!this.validatePincode(pincode)) {
      return false;
    }

    try {
      // Use a minimal weight for checking serviceability
      const warehousePincode = this.getConfigValue<string>(
        "warehousePincode",
        "110001"
      );

      const params: ShiprocketServiceabilityRequest = {
        pickup_postcode: warehousePincode,
        delivery_postcode: pincode,
        weight: 0.5,
        cod: 0,
      };

      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.SERVICEABILITY}?${queryString}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data: ShiprocketServiceabilityResponse = await response.json();
      return data.data.available_courier_companies.length > 0;
    } catch (error) {
      console.error("Serviceability check failed:", error);
      return false;
    }
  }
  /**
   * Get shipping rates from Shiprocket
   * Returns all couriers with rating >= 4
   */
  async getRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      const params: ShiprocketServiceabilityRequest = {
        pickup_postcode: request.fromPincode,
        delivery_postcode: request.toPincode,
        weight: request.weight,
        cod: request.cod as 0 | 1,
      };

      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.SERVICEABILITY}?${queryString}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get rates: ${response.statusText}`);
      }

      const res: ShiprocketServiceabilityResponse = await response.json();

      // Filter couriers: non-blocked AND rating >= 4
      const filteredCouriers = res.data.available_courier_companies.filter(
        (courier) =>
          courier.blocked === 0 && // Must be non-blocked
          courier.rating >= 4 // Must have rating >= 4
      );

      console.log("🚚 Shiprocket Rates Debug:");
      console.log(
        `- Total couriers from API: ${res.data.available_courier_companies.length}`
      );
      console.log(`- Filtered (rating >= 4): ${filteredCouriers.length}`);
      console.log(
        `- Delivery days breakdown:`,
        filteredCouriers.reduce((acc, c) => {
          const days = Number(c.estimated_delivery_days) || 3;
          acc[days] = (acc[days] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      );

      if (filteredCouriers.length === 0) {
        console.warn(
          `No couriers available with rating >= 4 for pincode ${request.toPincode}`
        );
        return [];
      }

      // Map all filtered couriers to our ShippingRate format
      const rates = filteredCouriers.map((courier) => {
        return mapShiprocketRateToShippingRate(courier, this.config.id);
      });

      return rates;
    } catch (error) {
      this.handleError(error, "get rates");
    }
  }

  /**
   * Create shipment in Shiprocket
   */
  async createShipment(request: CreateShipmentRequest): Promise<Shipment> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      // Step 1: Create order in Shiprocket
      const orderData = this.buildShiprocketOrder(request);
      const orderResponse = await this.createShiprocketOrder(orderData);

      // Step 2: Assign AWB (get tracking number)
      const awbResponse = await this.assignAWB(
        orderResponse.shipment_id,
        request.selectedRate?.courierCode
      );

      // Step 3: Map to our Shipment format
      const shipment = mapShiprocketAWBToShipment(
        awbResponse,
        this.config.id,
        request.orderId
      );

      // Log success
      await this.logSuccess({
        orderId: request.orderId,
        eventType: "shipment_created",
        request: orderData,
        response: awbResponse,
        metadata: {
          shipmentId: orderResponse.shipment_id,
          awbCode: awbResponse.response.data.awb_code,
        },
      });

      return shipment;
    } catch (error) {
      await this.logFailure({
        orderId: request.orderId,
        eventType: "shipment_created",
        error: error as Error,
        request,
      });
      throw error;
    }
  }

  /**
   * Track shipment by AWB code
   */
  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.TRACK}/${trackingNumber}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to track shipment: ${response.statusText}`);
      }

      const data: ShiprocketTrackingResponse = await response.json();
      return mapShiprocketTrackingToTrackingInfo(data, trackingNumber);
    } catch (error) {
      this.handleError(error, "track shipment");
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(trackingNumber: string): Promise<boolean> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      const payload: ShiprocketCancelShipmentRequest = {
        awbs: [trackingNumber],
      };

      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.CANCEL_SHIPMENT}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel shipment: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to cancel shipment:", error);
      return false;
    }
  }

  /**
   * Handle Shiprocket webhook
   */
  async handleWebhook(payload: any): Promise<WebhookEvent> {
    const webhookData = payload as ShiprocketWebhookPayload;

    // Extract order ID from webhook
    const orderId = webhookData.order_id;

    // Map status
    const status: TrackingInfo["currentStatus"] = {
      status: mapShiprocketStatusToOurs(webhookData.shipment_status_id),
      providerStatus: webhookData.shipment_status,
      location: webhookData.destination,
      timestamp: new Date(),
      description: webhookData.current_status,
    };

    return {
      orderId,
      trackingNumber: webhookData.awb,
      status,
      rawPayload: payload,
    };
  }

  // ============================================================================
  // SHIPROCKET-SPECIFIC METHODS
  // ============================================================================

  /**
   * Schedule pickup for shipments
   */
  async schedulePickup(params: {
    trackingNumbers: string[];
    pickupDate: Date;
    pickupTime?: string;
  }): Promise<{ pickupId: string }> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      // Get shipment IDs from tracking numbers (you'd need to store this mapping)
      const shipmentIds = await this.getShipmentIdsByAWB(
        params.trackingNumbers
      );

      const payload: ShiprocketSchedulePickupRequest = {
        shipment_id: shipmentIds,
        pickup_date: params.pickupDate.toISOString().split("T")[0],
      };

      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.SCHEDULE_PICKUP}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to schedule pickup: ${response.statusText}`);
      }

      const data: ShiprocketSchedulePickupResponse = await response.json();

      return {
        pickupId: data.pickup_token_number,
      };
    } catch (error) {
      this.handleError(error, "schedule pickup");
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(trackingNumber: string): Promise<{ labelUrl: string }> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      const shipmentId = await this.getShipmentIdByAWB(trackingNumber);

      const payload: ShiprocketGenerateLabelRequest = {
        shipment_id: [shipmentId],
      };

      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.GENERATE_LABEL}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate label: ${response.statusText}`);
      }

      const data: ShiprocketGenerateLabelResponse = await response.json();

      return {
        labelUrl: data.label_url,
      };
    } catch (error) {
      this.handleError(error, "generate label");
    }
  }

  /**
   * Generate manifest for multiple shipments
   */
  async generateManifest(
    trackingNumbers: string[]
  ): Promise<{ manifestUrl: string }> {
    this.ensureInitialized();
    await this.ensureAuthenticated();

    try {
      const shipmentIds = await this.getShipmentIdsByAWB(trackingNumbers);

      const payload: ShiprocketGenerateManifestRequest = {
        shipment_id: shipmentIds,
      };

      const response = await fetch(
        `${this.baseUrl}${SHIPROCKET_ENDPOINTS.GENERATE_MANIFEST}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate manifest: ${response.statusText}`);
      }

      const data: ShiprocketGenerateManifestResponse = await response.json();

      return {
        manifestUrl: data.manifest_url,
      };
    } catch (error) {
      this.handleError(error, "generate manifest");
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build Shiprocket order object from our request
   */
  private buildShiprocketOrder(
    request: CreateShipmentRequest
  ): ShiprocketCreateOrderRequest {
    const dimensions = request.package.dimensions || DEFAULT_PACKAGE_DIMENSIONS;
    const pickupLocation = this.getConfigValue<string>(
      "pickupLocationName",
      "Primary"
    );

    // Split name into first and last
    const nameParts = request.toAddress.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    return {
      order_id: request.orderCode,
      order_date: new Date().toISOString().replace("T", " ").substring(0, 16),
      pickup_location: pickupLocation,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: request.toAddress.addressLine1,
      billing_address_2: request.toAddress.addressLine2,
      billing_city: request.toAddress.city,
      billing_pincode: request.toAddress.pincode,
      billing_state: request.toAddress.state,
      billing_country: request.toAddress.country,
      billing_email: request.toAddress.email || "",
      billing_phone: request.toAddress.phone,
      shipping_is_billing: true,
      order_items: request.package.items?.map((item) => ({
        name: item.name,
        sku: item.sku || `SKU-${item.name}`,
        units: item.quantity,
        selling_price: item.price,
      })) || [
        {
          name: request.package.description || "Product",
          sku: "DEFAULT-SKU",
          units: 1,
          selling_price: request.package.declaredValue,
        },
      ],
      // payment_method: request.cod === 1 ? "COD" : "Prepaid",
      payment_method: "Prepaid",
      sub_total: request.package.declaredValue,
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
      weight: request.package.weight,
    };
  }

  /**
   * Create order in Shiprocket
   */
  private async createShiprocketOrder(
    orderData: ShiprocketCreateOrderRequest
  ): Promise<ShiprocketCreateOrderResponse> {
    const response = await fetch(
      `${this.baseUrl}${SHIPROCKET_ENDPOINTS.CREATE_ORDER}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create order: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Assign AWB to shipment
   */
  private async assignAWB(
    shipmentId: number,
    courierId?: string
  ): Promise<ShiprocketAssignAWBResponse> {
    const payload: ShiprocketAssignAWBRequest = {
      shipment_id: shipmentId,
      courier_id: courierId ? parseInt(courierId) : 0, // 0 = auto-assign
    };

    const response = await fetch(
      `${this.baseUrl}${SHIPROCKET_ENDPOINTS.ASSIGN_AWB}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to assign AWB: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get shipment ID by AWB code
   * Note: You'd need to store this mapping or query Shiprocket API
   */
  private async getShipmentIdByAWB(awbCode: string): Promise<number> {
    // TODO: Implement this by storing shipment_id in order metadata
    // or by querying Shiprocket's shipment list API
    throw new Error(
      "getShipmentIdByAWB not implemented - store shipmentId in order metadata"
    );
  }

  /**
   * Get multiple shipment IDs by AWB codes
   */
  private async getShipmentIdsByAWB(awbCodes: string[]): Promise<number[]> {
    return Promise.all(awbCodes.map((awb) => this.getShipmentIdByAWB(awb)));
  }
}
