import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Test setup and teardown
beforeAll(async () => {
  console.log('Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PLAID_ENV = 'sandbox';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  process.env.STRIKE_API_KEY = 'test_api_key';
  process.env.BREEZ_API_KEY = 'test_api_key';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars';
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset any global state before each test
  jest.clearAllMocks();
});
