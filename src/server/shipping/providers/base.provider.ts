/**
 * Base Shipping Provider
 *
 * Abstract base class that provides common functionality for all shipping providers.
 * Implements the IShippingProvider interface with shared utilities.
 */

import type { IShippingProvider } from "../domain/provider.interface";
import type {
  ConnectionRequestBody,
  ProviderConnectionResult,
  ShippingRate,
} from "../domain/shipping.types";

export abstract class BaseShippingProvider implements IShippingProvider {
  protected providerId!: string;
  protected initialized = false;

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Connect provider account with credentials
   * Each provider implements their own connection logic
   * @param credentials Provider-specific credentials
   * @returns Connection result with token and account info
   */
  abstract connect(
    requestBody: ConnectionRequestBody
  ): Promise<ProviderConnectionResult>;

  abstract getProviderId(): string;
  abstract getProviderName(): string;
  abstract checkServiceability(payload: any): Promise<any>;
  abstract getRates(request: any): Promise<ShippingRate[]>;
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
  async initialize(providerId: string): Promise<void> {
    this.providerId = providerId;
    this.initialized = true;
  }
}
