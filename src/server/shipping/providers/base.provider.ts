/**
 * Base Shipping Provider
 *
 * Abstract base class that provides common functionality for all shipping providers.
 * Implements the IShippingProvider interface with shared utilities.
 */

import type { IShippingProvider } from "../domain/provider.interface";
import type { ProviderConfig } from "../domain/shipping.types";

export abstract class BaseShippingProvider implements IShippingProvider {
  protected config!: ProviderConfig;
  protected initialized = false;

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================================

  abstract getProviderId(): string;
  abstract getProviderName(): string;
  abstract checkServiceability(pincode: string): Promise<boolean>;
  abstract getRates(request: any): Promise<any[]>;
  abstract createShipment(request: any): Promise<any>;
  abstract trackShipment(trackingNumber: string): Promise<any>;
  abstract cancelShipment(trackingNumber: string): Promise<boolean>;
  abstract handleWebhook(payload: any): Promise<any>;

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  /**
   * Initialize provider with configuration
   */
  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }
}
