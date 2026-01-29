/**
 * Shipping Utility Functions
 * 
 * Helper functions for shipping-related calculations and formatting.
 */

import type { CheckoutItem } from "@/components/checkoutContainer/types";
/**
 * Calculate total weight from cart items
 * @param items - Cart items
 * @param defaultWeightPerItem - Default weight in kg if product weight not specified
 * @returns Total weight in kg
 */
export function calculateCartWeight(
  items: CheckoutItem[],
  defaultWeightPerItem: number = 0.5
): number {
  const totalWeight = items.reduce((total, item) => {
    // Use product weight if available, otherwise use default
    // const itemWeight = item.weight || defaultWeightPerItem;
    const itemWeight = 0.5; // defaultWeightPerItem;
    return total + itemWeight * item.quantity;
  }, 0);

  // Round to 2 decimal places
  return Math.round(totalWeight * 100) / 100;
}

/**
 * Format delivery estimate
 */
export function formatDeliveryEstimate(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

/**
 * Get estimated delivery date
 */
export function getEstimatedDeliveryDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Format delivery date
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Validate Indian pincode
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

/**
 * Get shipping method display name
 */
export function getShippingMethodName(mode: string): string {
  const names: Record<string, string> = {
    STANDARD: "Standard Delivery",
    EXPRESS: "Express Delivery",
    ECONOMY: "Economy Delivery",
    SAME_DAY: "Same Day Delivery",
  };
  return names[mode] || mode;
}

