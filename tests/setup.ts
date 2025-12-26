import '@testing-library/jest-dom';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Ensure required env vars are set for tests
if (!process.env.KV_REST_API_TOKEN || !process.env.KV_REST_API_URL) {
  console.warn("⚠️  Warning: Upstash Redis credentials not found in .env file");
  console.warn("⚠️  Some tests may fail. Please add:");
  console.warn("   UPSTASH_REDIS_REST_URL=your-url");
  console.warn("   UPSTASH_REDIS_REST_TOKEN=your-token");
}

