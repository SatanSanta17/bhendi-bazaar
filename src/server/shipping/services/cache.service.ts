/**
 * Shipping Cache Service
 *
 * Manages rate caching to improve performance and reduce API calls.
 * Implements intelligent caching with TTL and cache warming.
 */

import type { ShippingRate, ShippingRateRequest } from "../domain";
import { shippingRateCacheRepository } from "../repositories";

export class ShippingCacheService {
  // Default cache TTL in minutes
  private readonly DEFAULT_TTL_MINUTES = 24 * 60; // 24 hours

  // ============================================================================
  // CACHE RETRIEVAL
  // ============================================================================

  /**
   * Get cached rate if available and valid
   */
  async getCachedRate(
    request: ShippingRateRequest,
    providerId: string
  ): Promise<ShippingRate | null> {
    try {
      const cache = await shippingRateCacheRepository.findValidCachedRate({
        providerId,
        fromPincode: request.fromPincode,
        toPincode: request.toPincode,
        weight: request.weight,
        mode: request.cod === 1 ? "COD" : "PREPAID",
      });

      if (!cache) return null;

      // Convert cached data to ShippingRate format
      return {
        providerId: cache.providerId,
        providerName: "", // Will be filled by provider
        courierName: cache.courierName,
        rate: cache.rate,
        estimatedDays: cache.estimatedDays,
        mode: request.cod === 1 ? "COD" : "PREPAID",
        available: true,
        metadata: cache.metadata as Record<string, any>,
      };
    } catch (error) {
      console.error("Error retrieving cached rate:", error);
      return null;
    }
  }

  /**
   * Get multiple cached rates for different providers
   */
  async getCachedRates(
    request: ShippingRateRequest,
    providerIds: string[]
  ): Promise<ShippingRate[]> {
    const rates: ShippingRate[] = [];

    await Promise.all(
      providerIds.map(async (providerId) => {
        const rate = await this.getCachedRate(request, providerId);
        if (rate) {
          rates.push(rate);
        }
      })
    );

    return rates;
  }

  // ============================================================================
  // CACHE STORAGE
  // ============================================================================

  /**
   * Cache a single rate
   */
  async cacheRate(
    rate: ShippingRate,
    request: ShippingRateRequest,
    ttlMinutes?: number
  ): Promise<void> {
    try {
      await shippingRateCacheRepository.cacheRate({
        providerId: rate.providerId,
        fromPincode: request.fromPincode,
        toPincode: request.toPincode,
        weight: request.weight,
        mode: request.cod === 1 ? "COD" : "PREPAID",
        rate: rate.rate,
        courierName: rate.courierName,
        estimatedDays: rate.estimatedDays,
        metadata: rate.metadata,
        ttlMinutes: ttlMinutes ?? this.DEFAULT_TTL_MINUTES,
      });
    } catch (error) {
      console.error("Error caching rate:", error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Cache multiple rates
   */
  async cacheRates(
    rates: ShippingRate[],
    request: ShippingRateRequest,
    ttlMinutes?: number
  ): Promise<void> {
    await Promise.all(
      rates.map((rate) => this.cacheRate(rate, request, ttlMinutes))
    );
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear cache for a specific provider
   */
  async clearProviderCache(providerId: string): Promise<number> {
    return await shippingRateCacheRepository.clearProviderCache(providerId);
  }

  /**
   * Clear cache for a specific route
   */
  async clearRouteCache(
    fromPincode: string,
    toPincode: string
  ): Promise<number> {
    return await shippingRateCacheRepository.clearRouteCache({
      fromPincode,
      toPincode,
    });
  }

  /**
   * Clear all expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    return await shippingRateCacheRepository.cleanExpiredCache();
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAllCache(): Promise<number> {
    return await shippingRateCacheRepository.clearAllCache();
  }

  // ============================================================================
  // CACHE ANALYTICS
  // ============================================================================

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total: number;
    valid: number;
    expired: number;
    hitRate?: number;
  }> {
    return await shippingRateCacheRepository.getCacheStats();
  }

  /**
   * Check if rate is cached and valid
   */
  async isCached(
    request: ShippingRateRequest,
    providerId: string
  ): Promise<boolean> {
    const rate = await this.getCachedRate(request, providerId);
    return rate !== null;
  }

  // ============================================================================
  // CACHE WARMING (Optional - for popular routes)
  // ============================================================================

  /**
   * Warm cache for popular routes
   * This can be run as a background job
   */
  async warmCache(params: {
    routes: Array<{ fromPincode: string; toPincode: string }>;
    weights: number[];
    modes: Array<"prepaid" | "cod">;
    getRatesFunction: (request: ShippingRateRequest) => Promise<ShippingRate[]>;
  }): Promise<number> {
    let cachedCount = 0;

    for (const route of params.routes) {
      for (const weight of params.weights) {
        for (const mode of params.modes) {
          try {
            const request: ShippingRateRequest = {
              fromPincode: route.fromPincode,
              toPincode: route.toPincode,
              weight,
              cod: mode.toLowerCase() === "cod" ? 1 : 0,
            };

            // Skip if already cached
            const providers = ["shiprocket"]; // Add all your providers
            const anyCached = await Promise.any(
              providers.map((pid) => this.isCached(request, pid))
            );

            if (anyCached) continue;

            // Get fresh rates and cache them
            const rates = await params.getRatesFunction(request);
            await this.cacheRates(rates, request);
            cachedCount += rates.length;
          } catch (error) {
            console.error("Error warming cache for route:", route, error);
          }
        }
      }
    }

    return cachedCount;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get cache key for a request
   */
  getCacheKey(request: ShippingRateRequest, providerId: string): string {
    return `${providerId}_${request.fromPincode}_${request.toPincode}_${
      request.weight
    }_${request.cod === 1 ? "COD" : "PREPAID"}`;
  }

  /**
   * Determine appropriate TTL based on route popularity
   */
  getAdaptiveTTL(fromPincode: string, toPincode: string): number {
    // Popular metros - shorter TTL (rates change more frequently)
    const metroFirstDigits = ["1", "4", "5", "6", "7"];
    const fromDigit = fromPincode[0];
    const toDigit = toPincode[0];

    if (
      metroFirstDigits.includes(fromDigit) &&
      metroFirstDigits.includes(toDigit)
    ) {
      return 12 * 60; // 12 hours for metro-to-metro
    }

    // Default for other routes
    return this.DEFAULT_TTL_MINUTES;
  }
}

// Singleton instance
export const shippingCacheService = new ShippingCacheService();
