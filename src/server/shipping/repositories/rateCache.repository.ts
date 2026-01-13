/**
 * ShippingRateCache Repository
 * 
 * Manages the shipping rate cache to reduce API calls and improve performance.
 * Implements caching with TTL (time-to-live) and automatic expiry.
 */

import { prisma } from "@/lib/prisma";
import type { ShippingRateCache, Prisma } from "@prisma/client";

export class ShippingRateCacheRepository {
  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find cached rate by unique parameters
   * Does NOT check if expired - use isCacheValid() separately
   */
  async findCachedRate(params: {
    providerId: string;
    fromPincode: string;
    toPincode: string;
    weight: number;
    mode: string;
  }): Promise<ShippingRateCache | null> {
    return await prisma.shippingRateCache.findUnique({
      where: {
        providerId_fromPincode_toPincode_weight_mode: {
          providerId: params.providerId,
          fromPincode: params.fromPincode,
          toPincode: params.toPincode,
          weight: params.weight,
          mode: params.mode,
        },
      },
    });
  }

  /**
   * Find valid (non-expired) cached rate
   */
  async findValidCachedRate(params: {
    providerId: string;
    request: any;
  }): Promise<ShippingRateCache | null> {
    const cache = await this.findCachedRate({
      providerId: params.providerId,
      fromPincode: params.request.fromPincode,
      toPincode: params.request.toPincode,
      weight: params.request.weight ?? 0,
      mode: params.request.cod ? "COD" : "PREPAID",
    });

    if (!cache) return null;
    if (!this.isCacheValid(cache)) return null;

    return cache;
  }

  /**
   * Get all cached rates for a provider
   */
  async getCachesByProvider(providerId: string): Promise<ShippingRateCache[]> {
    return await prisma.shippingRateCache.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total: number;
    valid: number;
    expired: number;
  }> {
    const now = new Date();
    const [total, valid] = await Promise.all([
      prisma.shippingRateCache.count(),
      prisma.shippingRateCache.count({
        where: { expiresAt: { gt: now } },
      }),
    ]);

    return {
      total,
      valid,
      expired: total - valid,
    };
  }

  // ============================================================================
  // CREATE/UPDATE OPERATIONS
  // ============================================================================

  /**
   * Store or update a rate in cache
   * Uses upsert to handle both create and update cases
   */
  async cacheRate(data: {
    providerId: string;
    fromPincode: string;
    toPincode: string;
    weight: number;
    mode: string;
    rate: number;
    courierName: string;
    estimatedDays: number;
    metadata?: any;
    ttlMinutes?: number; // Default: 24 hours
  }): Promise<ShippingRateCache> {
    const ttl = data.ttlMinutes ?? 24 * 60; // Default 24 hours
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    return await prisma.shippingRateCache.upsert({
      where: {
        providerId_fromPincode_toPincode_weight_mode: {
          providerId: data.providerId,
          fromPincode: data.fromPincode,
          toPincode: data.toPincode,
          weight: data.weight,
          mode: data.mode,
        },
      },
      create: {
        providerId: data.providerId,
        fromPincode: data.fromPincode,
        toPincode: data.toPincode,
        weight: data.weight,
        mode: data.mode,
        rate: data.rate,
        courierName: data.courierName,
        estimatedDays: data.estimatedDays,
        metadata: data.metadata ?? null,
        expiresAt,
      },
      update: {
        rate: data.rate,
        courierName: data.courierName,
        estimatedDays: data.estimatedDays,
        metadata: data.metadata ?? null,
        expiresAt,
      },
    });
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  /**
   * Delete expired cache entries
   * Should be run periodically (e.g., via cron job)
   */
  async cleanExpiredCache(): Promise<number> {
    const result = await prisma.shippingRateCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Delete all cache for a specific provider
   */
  async clearProviderCache(providerId: string): Promise<number> {
    const result = await prisma.shippingRateCache.deleteMany({
      where: { providerId },
    });
    return result.count;
  }

  /**
   * Delete cache for specific route
   */
  async clearRouteCache(params: {
    fromPincode: string;
    toPincode: string;
  }): Promise<number> {
    const result = await prisma.shippingRateCache.deleteMany({
      where: {
        fromPincode: params.fromPincode,
        toPincode: params.toPincode,
      },
    });
    return result.count;
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAllCache(): Promise<number> {
    const result = await prisma.shippingRateCache.deleteMany({});
    return result.count;
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Check if a cache entry is still valid
   */
  isCacheValid(cache: ShippingRateCache): boolean {
    return cache.expiresAt > new Date();
  }

  /**
   * Calculate remaining cache time in minutes
   */
  getCacheRemainingTime(cache: ShippingRateCache): number {
    const now = new Date().getTime();
    const expiresAt = cache.expiresAt.getTime();
    const remainingMs = expiresAt - now;
    return Math.max(0, Math.floor(remainingMs / (60 * 1000)));
  }
}

// Singleton instance
export const shippingRateCacheRepository = new ShippingRateCacheRepository();
