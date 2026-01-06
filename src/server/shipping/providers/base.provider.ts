/**
 * Base Shipping Provider
 *
 * Abstract base class that provides common functionality for all shipping providers.
 * Implements the IShippingProvider interface with shared utilities.
 */

import type { IShippingProvider } from "../domain/provider.interface";
import type { ProviderConfig } from "../domain/shipping.types";
import { shippingEventRepository } from "../repositories/event.repository";

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
    await this.onInitialize();
  }

  /**
   * Override this for provider-specific initialization
   * (e.g., authenticate, validate credentials, etc.)
   */
  protected async onInitialize(): Promise<void> {
    // Base implementation does nothing
    // Subclasses can override for custom initialization
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Ensure provider is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        `${this.getProviderName()} provider not initialized. Call initialize() first.`
      );
    }
  }

  /**
   * Get configuration value safely
   */
  protected getConfigValue<T>(key: string, defaultValue?: T): T {
    this.ensureInitialized();

    if (typeof this.config.config === "object" && this.config.config !== null) {
      const value = (this.config.config as Record<string, any>)[key];
      if (value !== undefined) {
        return value as T;
      }
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(
      `Missing required configuration: ${key} for ${this.getProviderName()}`
    );
  }

  /**
   * Check if provider supports a shipping mode
   */
  protected supportsMode(mode: string): boolean {
    return this.config.supportedModes.includes(mode as any);
  }

  // ============================================================================
  // EVENT LOGGING
  // ============================================================================

  /**
   * Log shipping event for debugging and analytics
   */
  protected async logEvent(params: {
    orderId: string;
    eventType: string;
    status: "success" | "failed" | "pending";
    request?: any;
    response?: any;
    errorMessage?: string;
    errorCode?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await shippingEventRepository.create({
        order: {
          connect: {
            id: params.orderId,
          },
        },
        provider: {
          connect: {
            id: this.config.id,
          },
        },
        eventType: params.eventType,
        status: params.status,
        request: params.request ?? null,
        response: params.response ?? null,
        errorMessage: params.errorMessage,
        errorCode: params.errorCode,
        metadata: params.metadata ?? null,
      });
    } catch (error) {
      // Log error but don't throw - logging failure shouldn't break operations
      console.error(
        `Failed to log shipping event for ${this.getProviderName()}:`,
        error
      );
    }
  }

  /**
   * Log successful operation
   */
  protected async logSuccess(params: {
    orderId: string;
    eventType: string;
    request?: any;
    response?: any;
    metadata?: any;
  }): Promise<void> {
    await this.logEvent({
      ...params,
      status: "success",
    });
  }

  /**
   * Log failed operation
   */
  protected async logFailure(params: {
    orderId: string;
    eventType: string;
    error: Error;
    request?: any;
    metadata?: any;
  }): Promise<void> {
    await this.logEvent({
      orderId: params.orderId,
      eventType: params.eventType,
      status: "failed",
      request: params.request,
      errorMessage: params.error.message,
      errorCode: (params.error as any).code,
      metadata: params.metadata,
    });
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Handle and normalize API errors
   */
  protected handleError(error: any, context: string): never {
    const providerName = this.getProviderName();

    console.error(`${providerName} ${context} error:`, error);

    // Handle axios/fetch errors
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message ||
        "Unknown error";

      throw new Error(`${providerName} API error (${context}): ${message}`);
    }

    // Handle network errors
    if (error.request) {
      throw new Error(
        `${providerName} network error (${context}): Unable to reach API`
      );
    }

    // Generic error
    throw new Error(
      `${providerName} ${context} failed: ${error.message || "Unknown error"}`
    );
  }

  /**
   * Wrap async operations with error handling
   */
  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Validate required fields in an object
   */
  protected validateRequired(
    obj: Record<string, any>,
    fields: string[],
    context = "Request"
  ): void {
    const missing = fields.filter((field) => !obj[field]);

    if (missing.length > 0) {
      throw new Error(
        `${context} missing required fields: ${missing.join(", ")}`
      );
    }
  }

  /**
   * Validate Indian pincode format
   */
  protected validatePincode(pincode: string): boolean {
    return /^\d{6}$/.test(pincode);
  }

  /**
   * Validate phone number format
   */
  protected validatePhone(phone: string): boolean {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // Check for 10-digit Indian number
    return /^[6-9]\d{9}$/.test(cleaned);
  }
}
