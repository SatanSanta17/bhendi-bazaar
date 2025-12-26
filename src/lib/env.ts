/**
 * Environment Variable Validation
 * Ensures all required environment variables are set before the app starts
 */

const requiredEnvVars = [
  "BHENDI_BAZAAR_DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

