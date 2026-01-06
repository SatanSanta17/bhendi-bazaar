/**
 * Weight Calculator Utility
 * 
 * Calculates package weight from cart items and provides weight utilities.
 */

/**
 * Standard weight per item category (in kg)
 * These are rough estimates - should be configurable per product
 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  clothing: 0.3,
  electronics: 0.5,
  books: 0.4,
  accessories: 0.2,
  footwear: 0.5,
  default: 0.3,
};

/**
 * Calculate total package weight from items
 */
export function calculatePackageWeight(items: Array<{
  weight?: number;
  quantity: number;
  category?: string;
}>): number {
  let totalWeight = 0;

  for (const item of items) {
    const itemWeight = item.weight || DEFAULT_WEIGHTS[item.category || "default"] || DEFAULT_WEIGHTS.default;
    totalWeight += itemWeight * item.quantity;
  }

  // Round to 2 decimal places
  return Math.round(totalWeight * 100) / 100;
}

/**
 * Calculate volumetric weight (for large but light packages)
 * Formula: (Length × Width × Height) / 5000
 */
export function calculateVolumetricWeight(dimensions: {
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
}): number {
  const volumetricWeight =
    (dimensions.length * dimensions.width * dimensions.height) / 5000;
  
  return Math.round(volumetricWeight * 100) / 100;
}

/**
 * Get chargeable weight (higher of actual or volumetric)
 */
export function getChargeableWeight(params: {
  actualWeight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}): number {
  if (!params.dimensions) {
    return params.actualWeight;
  }

  const volumetricWeight = calculateVolumetricWeight(params.dimensions);
  return Math.max(params.actualWeight, volumetricWeight);
}

/**
 * Round weight up to nearest 0.5 kg (common courier practice)
 */
export function roundWeightUp(weight: number, increment = 0.5): number {
  return Math.ceil(weight / increment) * increment;
}

/**
 * Validate package dimensions
 */
export function validateDimensions(dimensions: {
  length: number;
  width: number;
  height: number;
}): { valid: boolean; error?: string } {
  // Check for positive values
  if (dimensions.length <= 0 || dimensions.width <= 0 || dimensions.height <= 0) {
    return {
      valid: false,
      error: "All dimensions must be greater than 0",
    };
  }

  // Check for reasonable maximums (most couriers have size limits)
  const maxSingleDimension = 150; // cm
  const maxGirth = 300; // cm (length + 2*(width + height))

  if (
    dimensions.length > maxSingleDimension ||
    dimensions.width > maxSingleDimension ||
    dimensions.height > maxSingleDimension
  ) {
    return {
      valid: false,
      error: `No single dimension should exceed ${maxSingleDimension}cm`,
    };
  }

  const girth =
    dimensions.length + 2 * (dimensions.width + dimensions.height);
  if (girth > maxGirth) {
    return {
      valid: false,
      error: `Total girth (length + 2*(width + height)) should not exceed ${maxGirth}cm`,
    };
  }

  return { valid: true };
}

/**
 * Estimate package size category
 */
export function getPackageSizeCategory(dimensions: {
  length: number;
  width: number;
  height: number;
}): "small" | "medium" | "large" {
  const volume = dimensions.length * dimensions.width * dimensions.height;

  // Volume in cubic cm
  if (volume <= 10000) return "small";      // ≤ 10,000 cm³
  if (volume <= 50000) return "medium";     // ≤ 50,000 cm³
  return "large";                           // > 50,000 cm³
}

