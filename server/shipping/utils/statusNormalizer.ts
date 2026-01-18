/**
 * Status Normalizer Utility
 * 
 * Normalizes shipping statuses from different providers to a common format.
 * Each provider has different status codes/names - this maps them to our standard.
 */

import type { ShipmentStatus } from "../domain/shipping.types";

/**
 * Status mapping for different providers
 */
const STATUS_MAPPINGS: Record<string, Record<string, ShipmentStatus>> = {
  // Shiprocket status mappings
  shiprocket: {
    "pending": "pending",
    "awaiting_pickup": "created",
    "pickup_scheduled": "created",
    "pickup_complete": "picked_up",
    "in_transit": "in_transit",
    "out_for_delivery": "out_for_delivery",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "rto": "returned",
    "lost": "failed",
    "damaged": "failed",
  },

  // Delhivery status mappings
  delhivery: {
    "Pending": "pending",
    "Pickup Scheduled": "created",
    "Manifested": "created",
    "Dispatched": "picked_up",
    "In Transit": "in_transit",
    "Out For Delivery": "out_for_delivery",
    "Delivered": "delivered",
    "Cancelled": "cancelled",
    "RTO": "returned",
    "Lost": "failed",
  },

  // BlueDart status mappings
  bluedart: {
    "Booked": "created",
    "Picked Up": "picked_up",
    "In Transit": "in_transit",
    "Out for Delivery": "out_for_delivery",
    "Delivered": "delivered",
    "Returned": "returned",
    "Cancelled": "cancelled",
  },
};

/**
 * Normalize provider status to common format
 */
export function normalizeShipmentStatus(
  provider: string,
  providerStatus: string
): ShipmentStatus {
  const providerMappings = STATUS_MAPPINGS[provider.toLowerCase()];
  
  if (!providerMappings) {
    console.warn(
      `No status mapping found for provider: ${provider}. Using default.`
    );
    return inferStatusFromString(providerStatus);
  }

  const normalized = providerMappings[providerStatus];
  
  if (!normalized) {
    console.warn(
      `Unknown status '${providerStatus}' for provider '${provider}'. Inferring from string.`
    );
    return inferStatusFromString(providerStatus);
  }

  return normalized;
}

/**
 * Infer status from string (fallback method)
 */
function inferStatusFromString(status: string): ShipmentStatus {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes("deliver")) return "delivered";
  if (lowerStatus.includes("out for")) return "out_for_delivery";
  if (lowerStatus.includes("transit")) return "in_transit";
  if (lowerStatus.includes("pick")) return "picked_up";
  if (lowerStatus.includes("cancel")) return "cancelled";
  if (lowerStatus.includes("return") || lowerStatus.includes("rto")) return "returned";
  if (lowerStatus.includes("fail") || lowerStatus.includes("lost")) return "failed";
  if (lowerStatus.includes("pending") || lowerStatus.includes("await")) return "pending";
  
  // Default to pending if can't determine
  return "pending";
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ShipmentStatus): string {
  const labels: Record<ShipmentStatus, string> = {
    pending: "Pending",
    created: "Label Created",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed: "Delivery Failed",
    returned: "Returned to Sender",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
}

/**
 * Get status color for UI (Tailwind classes)
 */
export function getStatusColor(status: ShipmentStatus): string {
  const colors: Record<ShipmentStatus, string> = {
    pending: "yellow",
    created: "blue",
    picked_up: "blue",
    in_transit: "purple",
    out_for_delivery: "indigo",
    delivered: "green",
    failed: "red",
    returned: "orange",
    cancelled: "gray",
  };

  return colors[status] || "gray";
}

/**
 * Check if status is terminal (final state)
 */
export function isTerminalStatus(status: ShipmentStatus): boolean {
  return ["delivered", "failed", "returned", "cancelled"].includes(status);
}

/**
 * Check if status indicates success
 */
export function isSuccessStatus(status: ShipmentStatus): boolean {
  return status === "delivered";
}

/**
 * Check if status indicates failure
 */
export function isFailureStatus(status: ShipmentStatus): boolean {
  return ["failed", "cancelled"].includes(status);
}

