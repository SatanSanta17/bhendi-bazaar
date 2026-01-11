/**
 * Shipping Orchestrator Service
 * 
 * Main service that coordinates all shipping operations.
 * Manages providers, rates, shipments, and tracking.
 */

import type {
  IShippingProvider,
  ShippingRateRequest,
  ShippingRate,
  CreateShipmentRequest,
  Shipment,
  TrackingInfo,
  SelectionCriteria,
  SelectionResult,
  ProviderConfig,
} from "../domain";
import { shippingProviderRepository, shippingEventRepository } from "../repositories";
import { shippingCacheService } from "./cache.service";
import { providerSelectorService } from "./selector.service";

export class ShippingOrchestratorService {
  private providers: Map<string, IShippingProvider> = new Map();
  private initialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Load and initialize all enabled providers
   * Should be called once at application startup
   */
  async loadProviders(
    providerFactories: Record<string, (config: any) => IShippingProvider>
  ): Promise<void> {
    try {
      // Get enabled providers from database
      const enabledProviders =
        await shippingProviderRepository.getEnabledProviders();

      // Initialize each provider
      for (const providerConfig of enabledProviders) {
        const factory = providerFactories[providerConfig.code];

        if (!factory) {
          console.warn(
            `No factory found for provider: ${providerConfig.code}. Skipping.`
          );
          continue;
        }

        try {
          const provider = factory(providerConfig);
          await provider.initialize(providerConfig as ProviderConfig);
          this.providers.set(providerConfig.id, provider);

          console.log(
            `✓ Initialized shipping provider: ${provider.getProviderName()}`
          );
        } catch (error) {
          console.error(
            `Failed to initialize provider ${providerConfig.code}:`,
            error
          );
        }
      }

      this.initialized = true;
      console.log(
        `Shipping module initialized with ${this.providers.size} provider(s)`
      );
    } catch (error) {
      console.error("Failed to load shipping providers:", error);
      throw new Error("Shipping module initialization failed");
    }
  }

  /**
   * Reload a specific provider (useful after config changes)
   */
  async reloadProvider(
    providerId: string,
    factory: (config: any) => IShippingProvider
  ): Promise<void> {
    const providerConfig = (await shippingProviderRepository.getById(
      providerId
    )) as ProviderConfig;

    if (!providerConfig || !providerConfig.isEnabled) {
      this.providers.delete(providerId);
      return;
    }

    const provider = factory(providerConfig);
    await provider.initialize(providerConfig);
    this.providers.set(providerId, provider);
  }

  // ============================================================================
  // RATE CALCULATION
  // ============================================================================

  /**
   * Get rates from all enabled providers
   */
  async getRatesFromAllProviders(
    request: ShippingRateRequest,
    options?: {
      useCache?: boolean;
      timeout?: number;
    }
  ): Promise<ShippingRate[]> {
    this.ensureInitialized();

    const allRates: ShippingRate[] = [];
    const useCache = options?.useCache ?? true;

    // Get rates from each provider
    await Promise.all(
      Array.from(this.providers.entries()).map(
        async ([providerId, provider]) => {
          try {
            // Try cache first
            if (useCache) {
              const cachedRate = await shippingCacheService.getCachedRate(
                request,
                providerId
              );

              if (cachedRate) {
                cachedRate.providerName = provider.getProviderName();
                allRates.push(cachedRate);
                return;
              }
            }

            // Call provider API
            const rates = await provider.getRates(request);
            allRates.push(...rates);

            // Cache the results
            if (useCache) {
              await shippingCacheService.cacheRates(rates, request);
            }
          } catch (error) {
            console.error(
              `Error getting rates from ${provider.getProviderName()}:`,
              error
            );
            // Continue with other providers even if one fails
          }
        }
      )
    );

    return allRates;
  }

  /**
   * Get best rate based on selection criteria
   */
  async getBestRate(
    request: ShippingRateRequest,
    criteria: SelectionCriteria
  ): Promise<SelectionResult | null> {
    const allRates = await this.getRatesFromAllProviders(request);
    return providerSelectorService.selectBestProvider(allRates, criteria);
  }
  /**
   * Get best rates with two-step filtering:
   * 1. Group by delivery days, pick cheapest in each group
   * 2. Return winners sorted by fastest delivery
   */
  async getBestRatesByDeliveryDays(
    request: ShippingRateRequest,
    options?: {
      useCache?: boolean;
      timeout?: number;
    }
  ): Promise<ShippingRate[]> {
    this.ensureInitialized();

    // Step 1: Get all rates from all providers
    const allRates = await this.getRatesFromAllProviders(request, options);

    if (allRates.length === 0) {
      return [];
    }

    // Step 2: Filter out unavailable rates
    const availableRates = allRates.filter((rate) => rate.available);

    if (availableRates.length === 0) {
      return [];
    }

    // Step 3: Group rates by estimatedDays and find cheapest for each day
    const cheapestByDays = new Map<number, ShippingRate>();

    for (const rate of availableRates) {
      const days = rate.estimatedDays;
      const existingCheapest = cheapestByDays.get(days);

      // If no rate for this day yet, or current rate is cheaper, update it
      if (!existingCheapest || rate.rate < existingCheapest.rate) {
        cheapestByDays.set(days, rate);
      }
    }

    // Step 4: Convert map to array and sort by fastest delivery (days ascending)
    const winners = Array.from(cheapestByDays.values()).sort(
      (a, b) => a.estimatedDays - b.estimatedDays
    );

    return winners;
  }

  // ============================================================================
  // SHIPMENT CREATION
  // ============================================================================

  /**
   * Create shipment with automatic fallback
   */
  async createShipmentWithFallback(
    request: CreateShipmentRequest,
    fallbackProviderIds?: string[]
  ): Promise<Shipment> {
    this.ensureInitialized();

    // Get provider from request or use first available
    const providerId = request.selectedRate?.providerId;

    if (!providerId) {
      throw new Error("No provider specified in request");
    }

    // Try primary provider
    try {
      return await this.createShipment(providerId, request);
    } catch (error) {
      console.error(`Primary provider failed:`, error);

      // Try fallback providers
      if (fallbackProviderIds && fallbackProviderIds.length > 0) {
        for (const fallbackId of fallbackProviderIds) {
          try {
            console.log(`Trying fallback provider: ${fallbackId}`);
            return await this.createShipment(fallbackId, request);
          } catch (fallbackError) {
            console.error(
              `Fallback provider ${fallbackId} failed:`,
              fallbackError
            );
          }
        }
      }

      // All providers failed
      throw new Error("All shipping providers failed to create shipment");
    }
  }

  /**
   * Create shipment with a specific provider
   */
  async createShipment(
    providerId: string,
    request: CreateShipmentRequest
  ): Promise<Shipment> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found or not enabled`);
    }

    try {
      // Create shipment
      const shipment = await provider.createShipment(request);

      // Log success
      await shippingEventRepository.create({
        order: {
          connect: {
            id: request.orderId,
          },
        },
        provider: {
          connect: {
            id: providerId,
          },
        },
        eventType: "shipment_created",
        status: "success",
        request: request as any,
        response: shipment as any,
      });

      return shipment;
    } catch (error) {
      // Log failure
      await shippingEventRepository.create({
        order: {
          connect: {
            id: request.orderId,
          },
        },
        provider: {
          connect: {
            id: providerId,
          },
        },
        eventType: "shipment_created",
        status: "failed",
        request: request as any,
        errorMessage: (error as Error).message,
      });

      throw error;
    }
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Track shipment across all providers
   */
  async trackShipment(
    trackingNumber: string,
    providerId?: string
  ): Promise<TrackingInfo> {
    this.ensureInitialized();

    // If provider specified, use it directly
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }
      return await provider.trackShipment(trackingNumber);
    }

    // Try all providers until one succeeds
    const errors: Error[] = [];

    for (const [id, provider] of this.providers.entries()) {
      try {
        return await provider.trackShipment(trackingNumber);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new Error(
      `Unable to track shipment: ${errors.map((e) => e.message).join(", ")}`
    );
  }

  // ============================================================================
  // CANCELLATION
  // ============================================================================

  /**
   * Cancel shipment
   */
  async cancelShipment(
    trackingNumber: string,
    providerId: string,
    orderId: string
  ): Promise<boolean> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    try {
      const success = await provider.cancelShipment(trackingNumber);

      // Log event
      await shippingEventRepository.create({
        order: {
          connect: {
            id: orderId,
          },
        },
        provider: {
          connect: {
            id: providerId,
          },
        },
        eventType: "cancellation",
        status: success ? "success" : "failed",
        metadata: { trackingNumber },
      });

      return success;
    } catch (error) {
      await shippingEventRepository.create({
        order: {
          connect: {
            id: orderId,
          },
        },
        provider: {
          connect: {
            id: providerId,
          },
        },
        eventType: "cancellation",
        status: "failed",
        errorMessage: (error as Error).message,
        metadata: { trackingNumber },
      });

      throw error;
    }
  }

  // ============================================================================
  // SERVICEABILITY
  // ============================================================================

  /**
   * Check if any provider can service a pincode
   */
  async checkServiceability(pincode: string): Promise<{
    serviceable: boolean;
    providers: string[];
  }> {
    const serviceableProviders: string[] = [];

    await Promise.all(
      Array.from(this.providers.entries()).map(async ([id, provider]) => {
        try {
          const canService = await provider.checkServiceability(pincode);
          if (canService) {
            serviceableProviders.push(provider.getProviderName());
          }
        } catch (error) {
          console.error(`Error checking serviceability for ${id}:`, error);
        }
      })
    );

    return {
      serviceable: serviceableProviders.length > 0,
      providers: serviceableProviders,
    };
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Handle webhook from provider
   */
  async handleWebhook(
    providerId: string,
    payload: any
  ): Promise<{
    orderId?: string;
    trackingNumber: string;
    status: any;
  }> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await provider.handleWebhook(payload);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Ensure module is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        "Shipping module not initialized. Call loadProviders() first."
      );
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): Array<{ id: string; name: string }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getProviderName(),
    }));
  }

  /**
   * Check if a specific provider is loaded
   */
  isProviderLoaded(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /**
   * Get provider count
   */
  getProviderCount(): number {
    return this.providers.size;
  }
}

// Singleton instance
export const shippingOrchestrator = new ShippingOrchestratorService();

