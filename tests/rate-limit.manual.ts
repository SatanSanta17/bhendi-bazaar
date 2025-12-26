/**
 * Manual Rate Limit Testing Script
 * 
 * This script tests rate limiting by making actual HTTP requests to your running dev server.
 * Run this with: npx tsx tests/rate-limit.manual.ts
 * 
 * Prerequisites:
 * 1. Dev server must be running (npm run dev)
 * 2. Upstash Redis credentials must be configured
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  route: string;
  expectedLimit: number;
  actualLimit: number;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Sleep helper
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test signup rate limit (5 requests per 15 min)
 */
async function testSignupRateLimit(): Promise<TestResult> {
  console.log('\n🧪 Testing /api/auth/signup rate limit...');
  const route = '/api/auth/signup';
  const expectedLimit = 5;
  let requestCount = 0;

  try {
    // Make requests until we hit the rate limit
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'Test123!@#',
        }),
      });

      requestCount++;
      console.log(`  Request ${requestCount}: ${response.status}`);

      if (response.status === 429) {
        const data = await response.json();
        console.log(`  ✅ Rate limited after ${requestCount} requests`);
        console.log(`  📝 Error message: ${data.error}`);
        
        return {
          route,
          expectedLimit,
          actualLimit: requestCount - 1,
          passed: requestCount - 1 === expectedLimit,
        };
      }

      // Small delay between requests
      await sleep(100);
    }

    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: 'Did not hit rate limit',
    };
  } catch (error) {
    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test order creation rate limit (20 requests per 1 min)
 */
async function testOrderRateLimit(): Promise<TestResult> {
  console.log('\n🧪 Testing /api/orders rate limit...');
  const route = '/api/orders';
  const expectedLimit = 20;
  let requestCount = 0;

  try {
    // Make requests until we hit the rate limit
    for (let i = 0; i < 25; i++) {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
          totals: { subtotal: 0, discount: 0, total: 0 },
          address: {
            fullName: 'Test User',
            phone: '1234567890',
            email: 'test@example.com',
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
            country: 'India',
          },
        }),
      });

      requestCount++;
      console.log(`  Request ${requestCount}: ${response.status}`);

      if (response.status === 429) {
        const data = await response.json();
        console.log(`  ✅ Rate limited after ${requestCount} requests`);
        console.log(`  📝 Error message: ${data.error}`);
        
        return {
          route,
          expectedLimit,
          actualLimit: requestCount - 1,
          passed: requestCount - 1 === expectedLimit,
        };
      }

      // Small delay between requests
      await sleep(50);
    }

    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: 'Did not hit rate limit',
    };
  } catch (error) {
    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test order lookup rate limit (100 requests per 1 min)
 */
async function testLookupRateLimit(): Promise<TestResult> {
  console.log('\n🧪 Testing /api/orders/lookup rate limit...');
  const route = '/api/orders/lookup';
  const expectedLimit = 100;
  let requestCount = 0;

  try {
    // Make requests until we hit the rate limit
    for (let i = 0; i < 110; i++) {
      const response = await fetch(`${BASE_URL}${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'BB-TEST' }),
      });

      requestCount++;
      
      if (requestCount % 10 === 0) {
        console.log(`  Request ${requestCount}: ${response.status}`);
      }

      if (response.status === 429) {
        const data = await response.json();
        console.log(`  ✅ Rate limited after ${requestCount} requests`);
        console.log(`  📝 Error message: ${data.error}`);
        
        return {
          route,
          expectedLimit,
          actualLimit: requestCount - 1,
          passed: requestCount - 1 === expectedLimit,
        };
      }

      // Very small delay to make requests quickly
      await sleep(10);
    }

    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: 'Did not hit rate limit',
    };
  } catch (error) {
    return {
      route,
      expectedLimit,
      actualLimit: requestCount,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Print test summary
 */
function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RATE LIMIT TEST SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} - ${result.route}`);
    console.log(`  Expected limit: ${result.expectedLimit}`);
    console.log(`  Actual limit: ${result.actualLimit}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }

    if (result.passed) passed++;
    else failed++;
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Rate Limit Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('⚠️  Make sure your dev server is running!');
  console.log('⚠️  Make sure Upstash Redis credentials are configured!\n');

  // Wait a moment
  await sleep(2000);

  // Run tests sequentially to avoid interference
  results.push(await testSignupRateLimit());
  
  console.log('\n⏳ Waiting 5 seconds before next test...');
  await sleep(5000);
  
  results.push(await testOrderRateLimit());
  
  console.log('\n⏳ Waiting 5 seconds before next test...');
  await sleep(5000);
  
  results.push(await testLookupRateLimit());

  // Print summary
  printSummary(results);

  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

