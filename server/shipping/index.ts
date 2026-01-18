/**
 * Shipping Module - Main Export
 * 
 * Central export point for the entire shipping module.
 * This is the main entry point for using shipping functionality.
 */

import './init';

// ============================================================================
// DOMAIN TYPES & INTERFACES
// ============================================================================

export * from "./domain";

// ============================================================================
// SERVICES (Primary API)
// ============================================================================

export * from "./services";

// ============================================================================
// REPOSITORIES (Direct database access if needed)
// ============================================================================

export * from "./repositories";

// ============================================================================
// PROVIDERS (For registering new providers)
// ============================================================================

export * from "./providers";

// ============================================================================
// UTILITIES
// ============================================================================

export * from "./utils";

// ============================================================================
// CONVENIENCE EXPORTS (Pre-configured instances)
// ============================================================================

export { initializeShippingModule, isShippingInitialized } from './init';


import { shippingOrchestrator } from "./services/orchestrator.service";

/**
 * Main shipping orchestrator instance
 * Use this for most shipping operations
 */
export { shippingOrchestrator };

/**
 * Get module status
 */
export function getShippingModuleStatus(): {
  initialized: boolean;
  providerCount: number;
  providers: Array<{ id: string; name: string }>;
} {
  return {
    initialized: shippingOrchestrator.getProviderCount() > 0,
    providerCount: shippingOrchestrator.getProviderCount(),
    providers: shippingOrchestrator.getAvailableProviders(),
  };
}

