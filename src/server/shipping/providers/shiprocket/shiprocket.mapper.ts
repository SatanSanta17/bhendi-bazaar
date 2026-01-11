/**
 * Shiprocket Response Mapper
 * 
 * Maps Shiprocket API responses to our common shipping types
 */

import type {
  ShippingRate,
  Shipment,
  TrackingInfo,
  TrackingStatus,
  ShipmentStatus,
} from "../../domain";
import type {
  ShiprocketCourierServiceability,
  ShiprocketTrackingResponse,
  ShiprocketAssignAWBResponse,
  ShiprocketStatusCode,
} from "./shiprocket.types";
import { normalizeShipmentStatus } from "../../utils";

/**
 * Map Shiprocket courier serviceability to our ShippingRate
 */
export function mapShiprocketRateToShippingRate(
  courier: ShiprocketCourierServiceability,
  providerId: string
): ShippingRate {
  // Parse estimated delivery days from ETD string
  // etd is in date form so we need to convert it to number of days and subtract from the current date
  const estimatedDays = Number(courier.estimated_delivery_days);

  return {
    providerId,
    providerName: "Shiprocket",
    courierName: `${courier.courier_name} ${courier.mode}`,
    courierCode: courier.id.toString(),
    rate: courier.rate,
    estimatedDays,
    mode: courier.mode,
    available: courier.blocked === 0,
    features: {
      insurance: false,
      cod: courier.cod === 1,
      tracking: true,
    },
    metadata: {
      courierId: courier.id,
      courierCompanyId: courier.courier_company_id,
      isHyperlocal: courier.is_hyperlocal,
      isSurface: courier.is_surface,
      rating: courier.rating,
      deliveryPerformance: courier.delivery_performance,
    },
  };
}

/**
 * Map Shiprocket AWB assignment to our Shipment
 */
export function mapShiprocketAWBToShipment(
  response: ShiprocketAssignAWBResponse,
  providerId: string,
  orderId: string
): Shipment {
  const data = response.response.data;

  return {
    providerId,
    providerShipmentId: data.shipment_id.toString(),
    trackingNumber: data.awb_code,
    courierName: data.courier_name,
    courierCode: data.courier_company_id.toString(),
    trackingUrl: `https://shiprocket.co/tracking/${data.awb_code}`,
    estimatedDelivery: data.pickup_scheduled_date
      ? new Date(data.pickup_scheduled_date)
      : undefined,
    labels: {
      // Labels will be generated separately
    },
    metadata: {
      shipmentId: data.shipment_id,
      courierCompanyId: data.courier_company_id,
      appliedWeight: data.applied_weight,
      routingCode: data.routing_code,
      rtoRoutingCode: data.rto_routing_code,
      invoiceNo: data.invoice_no,
      orderId,
    },
  };
}

/**
 * Map Shiprocket tracking to our TrackingInfo
 */
export function mapShiprocketTrackingToTrackingInfo(
  response: ShiprocketTrackingResponse,
  trackingNumber: string
): TrackingInfo {
  const data = response.tracking_data;
  const activities = data.shipment_track_activities || data.shipment_track || [];

  // Get current status from latest activity
  const latestActivity = activities[0];
  const currentStatus: TrackingStatus = {
    status: mapShiprocketStatusToOurs(latestActivity.sr_status),
    providerStatus: latestActivity.sr_status_label,
    location: latestActivity.location,
    timestamp: new Date(latestActivity.date),
    description: latestActivity.activity,
  };

  // Map all activities to tracking history
  const history: TrackingStatus[] = activities.map((activity) => ({
    status: mapShiprocketStatusToOurs(activity.sr_status),
    providerStatus: activity.sr_status_label,
    location: activity.location,
    timestamp: new Date(activity.date),
    description: activity.activity,
  }));

  // Parse ETD
  const estimatedDelivery = data.etd ? new Date(data.etd) : undefined;

  // Check if delivered
  const isDelivered = data.shipment_status === 5; // Delivered status code
  const deliveredAt = isDelivered
    ? new Date(latestActivity.date)
    : undefined;

  return {
    trackingNumber,
    courierName: "Shiprocket",
    currentStatus,
    history,
    estimatedDelivery,
    deliveredAt,
  };
}

/**
 * Map Shiprocket status to our ShipmentStatus
 */
export function mapShiprocketStatusToOurs(
  shiprocketStatus: string | number
): ShipmentStatus {
  // If it's a string, use the normalizer
  if (typeof shiprocketStatus === "string") {
    return normalizeShipmentStatus("shiprocket", shiprocketStatus);
  }

  // If it's a status code number
  const statusCode = shiprocketStatus as ShiprocketStatusCode;

  const statusMap: Record<number, ShipmentStatus> = {
    1: "pending", // NEW
    2: "picked_up", // PICKED_UP
    3: "in_transit", // IN_TRANSIT
    4: "out_for_delivery", // OUT_FOR_DELIVERY
    5: "delivered", // DELIVERED
    6: "cancelled", // CANCELLED
    7: "returned", // RTO_INITIATED
    8: "returned", // RTO_IN_TRANSIT
    9: "returned", // RTO_DELIVERED
    10: "failed", // LOST
    11: "failed", // DAMAGED
    12: "pending", // PICKUP_PENDING
    13: "created", // PICKUP_SCHEDULED
    14: "created", // MANIFESTED
    15: "failed", // NOT_PICKED_UP
    16: "failed", // PICKUP_EXCEPTION
    17: "failed", // UNDELIVERED
    18: "in_transit", // DELAYED
    19: "delivered", // PARTIAL_DELIVERED
    20: "failed", // DESTROYED
    21: "failed", // CONTACT_CUSTOMER_CARE
    22: "created", // OUT_FOR_PICKUP
    23: "created", // SHIPMENT_BOOKED
  };

  return statusMap[statusCode] || "pending";
}

