/**
 * Product Flag Enum
 * Used to mark products with special characteristics
 */
export enum ProductFlag {
  FEATURED = "FEATURED",
  HERO = "HERO",
  ON_OFFER = "ON_OFFER",
  NEW_ARRIVAL = "NEW_ARRIVAL",
  CLEARANCE_SALE = "CLEARANCE_SALE",
}

/**
 * Product Flag Metadata
 * UI labels and descriptions for each flag
 */
export const PRODUCT_FLAG_METADATA: Record<
  ProductFlag,
  { label: string; description: string; color?: string }
> = {
  [ProductFlag.FEATURED]: {
    label: "Featured Product",
    description: "Display this product in featured sections",
    color: "purple",
  },
  [ProductFlag.HERO]: {
    label: "Hero Product",
    description: "Display this product in hero sections on homepage",
    color: "blue",
  },
  [ProductFlag.ON_OFFER]: {
    label: "On Offer",
    description: "Mark this product as being on special offer",
    color: "orange",
  },
  [ProductFlag.NEW_ARRIVAL]: {
    label: "New Arrival",
    description: "Mark this product as a new arrival",
    color: "green",
  },
  [ProductFlag.CLEARANCE_SALE]: {
    label: "Clearance Sale",
    description: "Mark this product as part of clearance sale",
    color: "red",
  },
};

/**
 * Helper function to check if a product has a specific flag
 */
export function hasFlag(flags: ProductFlag[], flag: ProductFlag): boolean {
  return flags.includes(flag);
}

/**
 * Helper function to toggle a flag
 */
export function toggleFlag(flags: ProductFlag[], flag: ProductFlag): ProductFlag[] {
  return hasFlag(flags, flag)
    ? flags.filter((f) => f !== flag)
    : [...flags, flag];
}

