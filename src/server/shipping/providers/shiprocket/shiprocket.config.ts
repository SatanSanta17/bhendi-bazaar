/**
 * Shiprocket Configuration & Constants
 */

import { PackageDimensions } from "../../domain";

export const SHIPROCKET_CONFIG = {
  BASE_URL: "https://apiv2.shiprocket.in/v1/external",
  TOKEN_EXPIRY_HOURS: 240, // 10 days
  DEFAULT_CHANNEL_ID: "",
  TIMEOUT_MS: 30000, // 30 seconds
} as const;

export const SHIPROCKET_ENDPOINTS = {
  AUTH: "/auth/login",
  SERVICEABILITY: "/courier/serviceability",
  CREATE_ORDER: "/orders/create/adhoc",
  ASSIGN_AWB: "/courier/assign/awb",
  TRACK: "/courier/track/awb",
  SCHEDULE_PICKUP: "/courier/generate/pickup",
  GENERATE_LABEL: "/courier/generate/label",
  GENERATE_MANIFEST: "/courier/generate/manifest",
  CANCEL_SHIPMENT: "/orders/cancel/shipment/awbs",
} as const;

/**
 * Default package dimensions if not provided (in cm)
 */
export const DEFAULT_PACKAGE_DIMENSIONS = {
  length: 10,
  breadth: 10,
  height: 10,
} as PackageDimensions;

/**
 * Weight limits (in kg)
 */
export const WEIGHT_LIMITS = {
  MIN: 0.1,
  MAX: 50,
} as const;

