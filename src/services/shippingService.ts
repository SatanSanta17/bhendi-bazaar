/**
 * Client-side Shipping Service
 * 
 * Handles all shipping-related API calls from the frontend.
 */

import type {
  GetShippingRatesRequest,
  GetShippingRatesResponse,
} from "@/domain/shipping";

class ShippingService {
  private BASE_URL = "/api/shipping";

  /**
   * Get available shipping rates for a delivery
   */
  async getRates(
    request: GetShippingRatesRequest
  ): Promise<GetShippingRatesResponse> {
    const body = {
      fromPincode: request.fromPincode,
      toPincode: request.toPincode,
      weight: request.weight,
      cod: request.cod,
    };
    const response = await fetch(`${this.BASE_URL}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipping rates");
    }

    const data = await response.json();
    return data;
  }
}

export const shippingService = new ShippingService();
