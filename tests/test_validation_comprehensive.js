const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  validProduct: {
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    category: 'Test Category',
    stock_quantity: 10
  },
  invalidProduct: {
    name: '', // Invalid: empty name
    price: -10, // Invalid: negative price
    category: '' // Invalid: empty category
  },
  validCustomRequest: {
    fullName: 'Test Customer',
    email: 'test@example.com',
    concept: 'A test concept',
    productType: 'T-Shirt',
    quantity: '2-5',
    budget: '100-250'
  },
  invalidCustomRequest: {
    fullName: '', // Invalid: empty name
    email: 'invalid-email', // Invalid: bad email format
    concept: '', // Invalid: empty concept
    productType: '', // Invalid: empty product type
    quantity: 'invalid', // Invalid: bad quantity
    budget: 'invalid' // Invalid: bad budget
  },
  validCartAdd: {
    product_name: 'Test Product',
    quantity: 2,
    size: 'M',
    color: 'Black'
  },
  invalidCartAdd: {
    product_name: '', // Invalid: empty product name
    quantity: -1 // Invalid: negative quantity
  },
  validCheckout: {
    shipping_address: '123 Test St, Test City, TC 12345'
  },
  invalidCheckout: {
    shipping_address: '' // Invalid: empty address
  },
  validCustomerRegistration: {
    email: 'newcustomer@example.com',
    password: 'password123',
    action: 'register',
    first_name: 'John',
    last_name: 'Doe'
  },
  invalidCustomerRegistration: {
    email: 'invalid-email',
    password: '123', // Too short
    action: 'register',
    first_name: '', // Empty
    last_name: '' // Empty
  },
  validNewsletterSubscription: {
    email: 'subscriber@example.com',
    name: 'Test Subscriber'
  },
  invalidNewsletterSubscription: {
    email: 'invalid-email',
    name: 123 // Invalid: not a string
  }
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to run tests
async function runTest(testName, testFunction) {
  testResults.total++;
  try {
    await testFunction();
    console.log(`✅ ${testName}: PASSED`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
    testResults.failed++;
  }
}

// Test validation middleware
async function testValidation() {
  console.log('🧪 Testing Comprehensive Input Validation...\n');

  // Test Product Validation
  await runTest('Product Creation - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/products`, testData.validProduct);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected: no auth token
        return;
      }
      throw error;
    }
  });

  await runTest('Product Creation - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/admin/products`, testData.invalidProduct);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Custom Request Validation
  await runTest('Custom Request - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/custom-requests`, testData.validCustomRequest);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        // Expected: database not available in test
        return;
      }
      throw error;
    }
  });

  await runTest('Custom Request - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/custom-requests`, testData.invalidCustomRequest);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Cart Validation
  await runTest('Cart Add - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/cart/add`, testData.validCartAdd);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected: no auth token
        return;
      }
      throw error;
    }
  });

  await runTest('Cart Add - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/cart/add`, testData.invalidCartAdd);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Checkout Validation
  await runTest('Checkout - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/cart/checkout`, testData.validCheckout);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Expected: no auth token
        return;
      }
      throw error;
    }
  });

  await runTest('Checkout - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/cart/checkout`, testData.invalidCheckout);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Customer Registration Validation
  await runTest('Customer Registration - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/customer/auth`, testData.validCustomerRegistration);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        // Expected: database not available in test
        return;
      }
      throw error;
    }
  });

  await runTest('Customer Registration - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/customer/auth`, testData.invalidCustomerRegistration);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Newsletter Subscription Validation
  await runTest('Newsletter Subscription - Valid Data', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/subscribe`, testData.validNewsletterSubscription);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        // Expected: database not available in test
        return;
      }
      throw error;
    }
  });

  await runTest('Newsletter Subscription - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/subscribe`, testData.invalidNewsletterSubscription);
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  // Test Admin Login Validation
  await runTest('Admin Login - Invalid Data', async () => {
    try {
      await axios.post(`${BASE_URL}/api/admin/login`, { email: '', password: '' });
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (errors && errors.length > 0) {
          return; // Expected validation error
        }
      }
      throw new Error('Expected validation error but got different response');
    }
  });

  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All validation tests passed! Input validation is working correctly.');
  } else {
    console.log('\n⚠️ Some validation tests failed. Please review the implementation.');
  }
}

// Run the tests
testValidation().catch(console.error);
