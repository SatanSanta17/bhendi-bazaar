/**
 * Provider Selector Service
 *
 * Implements smart provider selection strategies based on various criteria.
 * Selects the best shipping provider from available options.
 */

import type {
  ShippingRate,
  SelectionCriteria,
  SelectionResult,
  FilteredRates,
  ProviderSelectionStrategy,
} from "../domain";

export class ProviderSelectorService {
  // ============================================================================
  // MAIN SELECTION METHOD
  // ============================================================================

  /**
   * Select the best provider from available rates
   */
  selectBestProvider(
    rates: ShippingRate[],
    criteria: SelectionCriteria
  ): SelectionResult | null {
    const startTime = Date.now();

    // Filter rates based on criteria
    const filtered = this.filterRates(rates, criteria);

    if (filtered.validRates.length === 0) {
      return null;
    }

    // Select best rate based on strategy
    let selectedRate: ShippingRate | null = null;
    let reason = "";

    switch (criteria.strategy) {
      case "cheapest":
        selectedRate = this.selectCheapest(filtered.validRates);
        reason = `Selected cheapest option at ₹${selectedRate?.rate}`;
        break;

      case "fastest":
        selectedRate = this.selectFastest(filtered.validRates);
        reason = `Selected fastest option with ${selectedRate?.estimatedDays} days delivery`;
        break;

      case "balanced":
        selectedRate = this.selectBalanced(
          filtered.validRates,
          criteria.balancedWeights
        );
        reason = "Selected based on best cost-time balance";
        break;

      case "priority":
        selectedRate = this.selectByPriority(
          filtered.validRates,
          criteria.preferredProviders
        );
        reason = "Selected based on provider priority";
        break;

      case "specific":
        selectedRate = this.selectSpecific(
          filtered.validRates,
          criteria.specificProviderId
        );
        reason = `Selected specific provider: ${criteria.specificProviderId}`;
        break;

      case "custom":
        if (criteria.customSelector) {
          selectedRate = criteria.customSelector(filtered.validRates);
          reason = "Selected using custom selector function";
        }
        break;
    }

    if (!selectedRate) {
      return null;
    }

    const selectionTimeMs = Date.now() - startTime;

    return {
      selectedRate,
      reason,
      alternativeRates: filtered.validRates.filter((r) => r !== selectedRate),
      metadata: {
        totalRatesEvaluated: rates.length,
        ratesFiltered: filtered.filteredRates.length,
        selectionTimeMs,
      },
    };
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  /**
   * Filter rates based on criteria
   */
  private filterRates(
    rates: ShippingRate[],
    criteria: SelectionCriteria
  ): FilteredRates {
    const validRates: ShippingRate[] = [];
    const filteredRates: ShippingRate[] = [];
    const filterReasons: Array<{ rate: ShippingRate; reason: string }> = [];

    for (const rate of rates) {
      // Filter by availability
      if (!rate.available) {
        filteredRates.push(rate);
        filterReasons.push({ rate, reason: "Not available" });
        continue;
      }

      // Filter by max cost
      if (criteria.maxCost !== undefined && rate.rate > criteria.maxCost) {
        filteredRates.push(rate);
        filterReasons.push({
          rate,
          reason: `Exceeds max cost of ₹${criteria.maxCost}`,
        });
        continue;
      }

      // Filter by max days
      if (
        criteria.maxDays !== undefined &&
        rate.estimatedDays > criteria.maxDays
      ) {
        filteredRates.push(rate);
        filterReasons.push({
          rate,
          reason: `Exceeds max delivery time of ${criteria.maxDays} days`,
        });
        continue;
      }

      validRates.push(rate);
    }

    return { validRates, filteredRates, filterReasons };
  }

  // ============================================================================
  // SELECTION STRATEGIES
  // ============================================================================

  /**
   * Select cheapest option
   */
  private selectCheapest(rates: ShippingRate[]): ShippingRate | null {
    if (rates.length === 0) return null;
    return rates.reduce((cheapest, current) =>
      current.rate < cheapest.rate ? current : cheapest
    );
  }

  /**
   * Select fastest option
   */
  private selectFastest(rates: ShippingRate[]): ShippingRate | null {
    if (rates.length === 0) return null;
    return rates.reduce((fastest, current) =>
      current.estimatedDays < fastest.estimatedDays ? current : fastest
    );
  }

  /**
   * Select balanced option (best cost-time ratio)
   */
  private selectBalanced(
    rates: ShippingRate[],
    weights?: { costWeight: number; speedWeight: number }
  ): ShippingRate | null {
    if (rates.length === 0) return null;

    // Default weights: equal balance
    const costWeight = weights?.costWeight ?? 0.5;
    const speedWeight = weights?.speedWeight ?? 0.5;

    // Normalize values to 0-1 scale
    const maxRate = Math.max(...rates.map((r) => r.rate));
    const maxDays = Math.max(...rates.map((r) => r.estimatedDays));

    // Calculate score for each rate (lower is better)
    const scored = rates.map((rate) => {
      const normalizedCost = rate.rate / maxRate;
      const normalizedDays = rate.estimatedDays / maxDays;
      const score =
        normalizedCost * costWeight + normalizedDays * speedWeight;

      return { rate, score };
    });

    // Return rate with lowest score
    return scored.reduce((best, current) =>
      current.score < best.score ? current : best
    ).rate;
  }

  /**
   * Select by provider priority
   */
  private selectByPriority(
    rates: ShippingRate[],
    preferredProviders?: string[]
  ): ShippingRate | null {
    if (rates.length === 0) return null;

    // If preferred providers specified, try to select from them first
    if (preferredProviders && preferredProviders.length > 0) {
      for (const providerId of preferredProviders) {
        const rate = rates.find((r) => r.providerId === providerId);
        if (rate) return rate;
      }
    }

    // Fallback: return first rate (assuming rates are already sorted by priority)
    return rates[0];
  }

  /**
   * Select specific provider
   */
  private selectSpecific(
    rates: ShippingRate[],
    providerId?: string
  ): ShippingRate | null {
    if (!providerId) return null;
    return rates.find((r) => r.providerId === providerId) || null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Compare two rates
   */
  compareRates(
    rate1: ShippingRate,
    rate2: ShippingRate
  ): {
    cheaper: ShippingRate;
    faster: ShippingRate;
    costDifference: number;
    daysDifference: number;
  } {
    return {
      cheaper: rate1.rate <= rate2.rate ? rate1 : rate2,
      faster:
        rate1.estimatedDays <= rate2.estimatedDays ? rate1 : rate2,
      costDifference: Math.abs(rate1.rate - rate2.rate),
      daysDifference: Math.abs(rate1.estimatedDays - rate2.estimatedDays),
    };
  }

  /**
   * Get recommended strategy based on rates
   */
  getRecommendedStrategy(rates: ShippingRate[]): ProviderSelectionStrategy {
    if (rates.length === 0) return "priority";
    if (rates.length === 1) return "priority";

    // Check price range
    const prices = rates.map((r) => r.rate);
    const priceRange = Math.max(...prices) - Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceVariation = priceRange / avgPrice;

    // Check time range
    const days = rates.map((r) => r.estimatedDays);
    const daysRange = Math.max(...days) - Math.min(...days);

    // If significant price variation (>20%) and time variation, recommend balanced
    if (priceVariation > 0.2 && daysRange > 1) {
      return "balanced";
    }

    // If similar prices, recommend fastest
    if (priceVariation < 0.1) {
      return "fastest";
    }

    // Otherwise, recommend cheapest
    return "cheapest";
  }
}

// Singleton instance
export const providerSelectorService = new ProviderSelectorService();
