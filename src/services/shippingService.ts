/**
 * Client-side Shipping Service
 * 
 * Handles all shipping-related API calls from the frontend.
 */

import type {
  ShippingRate,
  ServiceabilityResponse,
  TrackingInfo,
} from "@/domain/shipping";

export const shippingService = {
  /**
   * Check if delivery is available to a pincode
   */
  async checkServiceability(pincode: string): Promise<ServiceabilityResponse> {
    const response = await fetch(
      `/api/shipping/serviceability?pincode=${pincode}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to check serviceability");
    }
    
    return response.json();
  },

  /**
   * Get available shipping rates for a delivery
   */
  async getRates(params: {
    toPincode: string;
    weight: number;
    mode?: "STANDARD" | "EXPRESS" | "ECONOMY";
  }): Promise<ShippingRate[]> {
    const response = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromPincode: "110001", // Default warehouse pincode - TODO: Make configurable
        toPincode: params.toPincode,
        weight: params.weight,
        mode: params.mode || "ALL",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipping rates");
    }

    const data = await response.json();
    return data.rates || [];
  },

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    const response = await fetch(`/api/shipping/track/${trackingNumber}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch tracking information");
    }

    return response.json();
  },

  /**
   * Get shipping details for an order
   */
  async getOrderShipping(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}/shipping`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch order shipping details");
    }

    return response.json();
  },
};

