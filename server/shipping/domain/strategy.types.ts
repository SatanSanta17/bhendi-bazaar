/**
 * Provider Selection Strategy Types
 * 
 * Defines how the system selects the best shipping provider
 * when multiple providers are available.
 */

import type { ShippingRate } from "./shipping.types";

// ============================================================================
// STRATEGY TYPES
// ============================================================================

export type ProviderSelectionStrategy =
  | "cheapest"      // Select provider with lowest cost
  | "fastest"       // Select provider with shortest delivery time
  | "balanced"      // Best cost/time ratio
  | "priority"      // Based on provider priority setting in database
  | "specific"      // Use a specific provider
  | "custom";       // Custom selection function

// ============================================================================
// SELECTION CRITERIA
// ============================================================================

export interface SelectionCriteria {
  /**
   * Selection strategy to use
   */
  strategy: ProviderSelectionStrategy;

  /**
   * Specific provider ID (required for 'specific' strategy)
   */
  specificProviderId?: string;

  /**
   * Filter: Exclude rates above this cost
   */
  maxCost?: number;

  /**
   * Filter: Exclude rates slower than this
   */
  maxDays?: number;

  /**
   * Give preference to these providers
   * They'll be considered first if their rates are competitive
   */
  preferredProviders?: string[];

  /**
   * Custom selection function (for 'custom' strategy)
   * @param rates Available rates from all providers
   * @returns Selected rate or null
   */
  customSelector?: (rates: ShippingRate[]) => ShippingRate | null;

  /**
   * Weight factors for balanced strategy (optional)
   * Default: equal weight (0.5, 0.5)
   */
  balancedWeights?: {
    costWeight: number;    // 0-1, weight for cost factor
    speedWeight: number;   // 0-1, weight for speed factor
  };
}

// ============================================================================
// SELECTION RESULT
// ============================================================================

export interface SelectionResult {
  /**
   * The selected shipping rate
   */
  selectedRate: ShippingRate;

  /**
   * Explanation of why this rate was selected
   */
  reason: string;

  /**
   * Alternative rates that were considered
   */
  alternativeRates: ShippingRate[];

  /**
   * Metadata about the selection process
   */
  metadata?: {
    totalRatesEvaluated: number;
    ratesFiltered: number;
    selectionTimeMs: number;
  };
}

// ============================================================================
// FILTER RESULTS
// ============================================================================

export interface FilteredRates {
  /**
   * Rates that passed all filters
   */
  validRates: ShippingRate[];

  /**
   * Rates that were filtered out
   */
  filteredRates: ShippingRate[];

  /**
   * Reasons why rates were filtered
   */
  filterReasons: Array<{
    rate: ShippingRate;
    reason: string;
  }>;
}

