/**
 * Shiprocket Response Mapper
 * 
 * Maps Shiprocket API responses to our common shipping types
 */

import type { ShippingRate } from "../../domain";

export function mapShiprocketRateToShippingRate(
  courier: any,
  providerId: string
): ShippingRate {
  const estimatedDays = Number(courier.estimated_delivery_days) || 3;
  const mode = courier.is_surface ? "surface" : "air";

  return {
    // Provider info
    providerId,
    providerName: "Shiprocket",

    // Courier info
    courierName: courier.courier_name,
    courierCode: courier.id.toString(),

    // Pricing
    rate: courier.rate,

    // Delivery info
    estimatedDays,
    etd: courier.etd,

    // Availability & mode
    available: courier.blocked === 0,
    mode,

    // Features
    features: {
      cod: courier.cod === 1,
      tracking: courier.realtime_tracking === "Real Time",
      insurance: false, // Shiprocket doesn't include this in rate response
      hyperlocal: courier.is_hyperlocal,
    },

    // Performance metrics
    performance: {
      rating: courier.rating,
      deliveryPerformance: courier.delivery_performance,
      pickupPerformance: courier.pickup_performance,
    },

    // Weight constraints
    constraints: {
      minWeight: courier.min_weight,
      maxWeight: parseFloat(courier.surface_max_weight || "0") || undefined,
      chargeWeight: courier.charge_weight,
    },

    // Additional charges
    charges: {
      freight: courier.freight_charge,
      cod: courier.cod_charges,
      coverage: courier.coverage_charges,
      rto: courier.rto_charges,
    },

    // Metadata
    metadata: {
      courierId: courier.id,
      courierCompanyId: courier.courier_company_id,
      isHyperlocal: courier.is_hyperlocal,
      isSurface: courier.is_surface,
      isCustomRate: courier.is_custom_rate === 1,
      zone: courier.zone,
      cutoffTime: courier.cutoff_time,
      realtimeTracking: courier.realtime_tracking,
      podAvailable: courier.pod_available,
    },
  };
}
