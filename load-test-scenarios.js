// Load Testing Scenarios using k6
// This file contains comprehensive load testing scenarios for the e-commerce platform

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data
const testUsers = [
  { email: 'user1@example.com', password: 'password123' },
  { email: 'user2@example.com', password: 'password123' },
  { email: 'user3@example.com', password: 'password123' },
];

const testProducts = [
  'product-1', 'product-2', 'product-3', 'product-4', 'product-5'
];

// ============================================================================
// LOAD TEST SCENARIOS
// ============================================================================

// Scenario 1: Normal Load Test
export const normalLoad = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
};

// Scenario 2: Stress Test
export const stressTest = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
};

// Scenario 3: Spike Test
export const spikeTest = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 10 },   // Normal load
    { duration: '30s', target: 500 }, // Spike to 500 users
    { duration: '1m', target: 500 },  // Stay at spike
    { duration: '30s', target: 10 },  // Return to normal
    { duration: '2m', target: 10 },   // Stay at normal
  ],
};

// Scenario 4: Soak Test (Long Duration)
export const soakTest = {
  executor: 'constant-vus',
  vus: 50,
  duration: '30m',
};

// ============================================================================
// TEST SCENARIOS CONFIGURATION
// ============================================================================

export const options = {
  scenarios: {
    // Choose one scenario at a time by commenting/uncommenting
    normal_load: normalLoad,
    // stress_test: stressTest,
    // spike_test: spikeTest,
    // soak_test: soakTest,
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate below 5%
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomProduct() {
  return testProducts[Math.floor(Math.random() * testProducts.length)];
}

function authenticateUser(user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${API_BASE}/auth/login`, loginPayload, params);
  
  check(response, {
    'login successful': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined,
  });

  if (response.status === 200) {
    return response.json('token');
  }
  return null;
}

function makeAuthenticatedRequest(method, url, payload = null, token = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    params.headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, payload ? JSON.stringify(payload) : null, params);
  } else if (method === 'PUT') {
    response = http.put(url, payload ? JSON.stringify(payload) : null, params);
  } else if (method === 'DELETE') {
    response = http.del(url, null, params);
  }

  // Record metrics
  requestCount.add(1);
  responseTime.add(response.timings.duration);
  errorRate.add(response.status >= 400);

  return response;
}

// ============================================================================
// USER JOURNEY SCENARIOS
// ============================================================================

// User Journey 1: Browse and Search Products
export function browseProducts() {
  // Get product categories
  let response = makeAuthenticatedRequest('GET', `${API_BASE}/products/categories`);
  check(response, {
    'categories loaded': (r) => r.status === 200,
  });

  sleep(1);

  // Search for products
  response = makeAuthenticatedRequest('GET', `${API_BASE}/products/search?q=laptop&limit=20`);
  check(response, {
    'search results loaded': (r) => r.status === 200,
    'search has results': (r) => r.json('data.length') > 0,
  });

  sleep(1);

  // Get product details
  const productId = getRandomProduct();
  response = makeAuthenticatedRequest('GET', `${API_BASE}/products/${productId}`);
  check(response, {
    'product details loaded': (r) => r.status === 200,
  });

  sleep(2);
}

// User Journey 2: User Registration and Authentication
export function userRegistrationFlow() {
  const newUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };

  // Register new user
  let response = makeAuthenticatedRequest('POST', `${API_BASE}/auth/register`, newUser);
  check(response, {
    'user registration successful': (r) => r.status === 201,
  });

  sleep(1);

  // Login with new user
  response = makeAuthenticatedRequest('POST', `${API_BASE}/auth/login`, {
    email: newUser.email,
    password: newUser.password,
  });
  
  check(response, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });

  sleep(1);
}

// User Journey 3: Shopping Cart Operations
export function shoppingCartFlow() {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) return;

  // Add item to cart
  const cartItem = {
    productId: getRandomProduct(),
    quantity: Math.floor(Math.random() * 3) + 1,
  };

  let response = makeAuthenticatedRequest('POST', `${API_BASE}/cart/items`, cartItem, token);
  check(response, {
    'item added to cart': (r) => r.status === 201,
  });

  sleep(1);

  // Get cart contents
  response = makeAuthenticatedRequest('GET', `${API_BASE}/cart`, null, token);
  check(response, {
    'cart retrieved': (r) => r.status === 200,
    'cart has items': (r) => r.json('items.length') > 0,
  });

  sleep(1);

  // Update cart item quantity
  const cartItems = response.json('items');
  if (cartItems && cartItems.length > 0) {
    const itemId = cartItems[0].id;
    response = makeAuthenticatedRequest('PUT', `${API_BASE}/cart/items/${itemId}`, {
      quantity: 2,
    }, token);
    
    check(response, {
      'cart item updated': (r) => r.status === 200,
    });
  }

  sleep(2);
}

// User Journey 4: Complete Order Process
export function completeOrderFlow() {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) return;

  // Add items to cart
  for (let i = 0; i < 2; i++) {
    const cartItem = {
      productId: getRandomProduct(),
      quantity: 1,
    };
    
    makeAuthenticatedRequest('POST', `${API_BASE}/cart/items`, cartItem, token);
    sleep(0.5);
  }

  // Get cart for checkout
  let response = makeAuthenticatedRequest('GET', `${API_BASE}/cart`, null, token);
  check(response, {
    'cart retrieved for checkout': (r) => r.status === 200,
  });

  sleep(1);

  // Create order
  const orderData = {
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    paymentMethod: {
      type: 'card',
      token: 'test_token_123',
    },
  };

  response = makeAuthenticatedRequest('POST', `${API_BASE}/orders`, orderData, token);
  check(response, {
    'order created': (r) => r.status === 201,
    'order has id': (r) => r.json('id') !== undefined,
  });

  if (response.status === 201) {
    const orderId = response.json('id');
    
    sleep(2);

    // Get order details
    response = makeAuthenticatedRequest('GET', `${API_BASE}/orders/${orderId}`, null, token);
    check(response, {
      'order details retrieved': (r) => r.status === 200,
    });
  }

  sleep(2);
}

// User Journey 5: User Profile Management
export function userProfileFlow() {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) return;

  // Get user profile
  let response = makeAuthenticatedRequest('GET', `${API_BASE}/users/profile`, null, token);
  check(response, {
    'profile retrieved': (r) => r.status === 200,
  });

  sleep(1);

  // Update profile
  const profileUpdate = {
    firstName: 'Updated',
    lastName: 'Name',
    preferences: {
      currency: 'USD',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
  };

  response = makeAuthenticatedRequest('PUT', `${API_BASE}/users/profile`, profileUpdate, token);
  check(response, {
    'profile updated': (r) => r.status === 200,
  });

  sleep(1);

  // Add address
  const newAddress = {
    type: 'shipping',
    firstName: 'John',
    lastName: 'Doe',
    address1: '456 Oak St',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
  };

  response = makeAuthenticatedRequest('POST', `${API_BASE}/users/addresses`, newAddress, token);
  check(response, {
    'address added': (r) => r.status === 201,
  });

  sleep(2);
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function () {
  // Randomly select a user journey to simulate realistic traffic patterns
  const scenarios = [
    browseProducts,
    userRegistrationFlow,
    shoppingCartFlow,
    completeOrderFlow,
    userProfileFlow,
  ];

  // Weight the scenarios based on typical e-commerce usage patterns
  const weights = [40, 5, 25, 15, 15]; // Percentages
  const random = Math.random() * 100;
  let cumulativeWeight = 0;
  
  for (let i = 0; i < scenarios.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      scenarios[i]();
      break;
    }
  }

  // Random sleep between 1-5 seconds to simulate user think time
  sleep(Math.random() * 4 + 1);
}

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

export function setup() {
  console.log('Starting load test...');
  console.log(`Target URL: ${BASE_URL}`);
  
  // Verify that the API is accessible
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API health check failed: ${response.status}`);
  }
  
  console.log('API health check passed');
  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests: ${requestCount.count}`);
  console.log(`Average response time: ${responseTime.avg}ms`);
  console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
}

// ============================================================================
// SPECIALIZED TEST SCENARIOS
// ============================================================================

// Database stress test - focuses on database-heavy operations
export function databaseStressTest() {
  const user = getRandomUser();
  const token = authenticateUser(user);
  
  if (!token) return;

  // Perform multiple database operations
  for (let i = 0; i < 5; i++) {
    // Search products (hits product database)
    makeAuthenticatedRequest('GET', `${API_BASE}/products/search?q=test&page=${i + 1}`);
    
    // Get user orders (hits order database)
    makeAuthenticatedRequest('GET', `${API_BASE}/orders?page=${i + 1}&limit=10`, null, token);
    
    sleep(0.5);
  }
}

// API rate limiting test
export function rateLimitTest() {
  // Make rapid requests to test rate limiting
  for (let i = 0; i < 20; i++) {
    const response = makeAuthenticatedRequest('GET', `${API_BASE}/products`);
    
    if (response.status === 429) {
      check(response, {
        'rate limit triggered': (r) => r.status === 429,
      });
      break;
    }
    
    sleep(0.1); // Very short sleep to trigger rate limiting
  }
}

// Cache performance test
export function cachePerformanceTest() {
  const productId = getRandomProduct();
  
  // First request (cache miss)
  let response = makeAuthenticatedRequest('GET', `${API_BASE}/products/${productId}`);
  const firstRequestTime = response.timings.duration;
  
  sleep(0.1);
  
  // Second request (cache hit)
  response = makeAuthenticatedRequest('GET', `${API_BASE}/products/${productId}`);
  const secondRequestTime = response.timings.duration;
  
  check(response, {
    'cache improves performance': () => secondRequestTime < firstRequestTime,
  });
}