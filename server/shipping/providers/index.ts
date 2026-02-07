/**
 * Shipping Provider Index
 * 
 * Registry of all available shipping providers.
 * Add new providers here as they are implemented.
 */

import { ShiprocketProvider } from "./shiprocket/shiprocket.provider";
export * from "./base.provider";
export { ShiprocketProvider } from "./shiprocket/shiprocket.provider";

// Provider registry - maps provider code to factory function
export const PROVIDER_FACTORIES = {
  shiprocket: () => new ShiprocketProvider(),
};
