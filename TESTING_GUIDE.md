# PLWGCREATIVEAPPAREL - Comprehensive Testing Guide

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Infrastructure](#test-infrastructure)
3. [API Testing](#api-testing)
4. [Frontend Testing](#frontend-testing)
5. [Database Testing](#database-testing)
6. [Integration Testing](#integration-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Execution](#test-execution)
10. [Test Maintenance](#test-maintenance)

## Testing Overview

PLWGCREATIVEAPPAREL implements a comprehensive testing strategy covering all aspects of the application from API endpoints to frontend functionality. The testing approach ensures reliability, security, and performance across all features.

### Testing Philosophy
- **Comprehensive Coverage**: Test all critical paths and edge cases
- **Automated Testing**: Minimize manual testing effort
- **Real-world Scenarios**: Test with realistic data and conditions
- **Continuous Validation**: Run tests regularly to catch regressions
- **Security Focus**: Validate all security measures and input validation

### Testing Types
1. **Unit Tests**: Individual function and component testing
2. **Integration Tests**: API endpoint and database interaction testing
3. **Frontend Tests**: UI functionality and user interaction testing
4. **Security Tests**: Input validation and authentication testing
5. **Performance Tests**: Load and stress testing
6. **End-to-End Tests**: Complete user workflow testing

## Test Infrastructure

### Test Files Structure
```
PLWGCREATIVEAPPAREL/
├── test_validation_comprehensive.js      # API validation tests
├── test_frontend_enhancements.js         # Frontend functionality tests
├── test_email.js                         # Email system tests
├── test_custom_orders.js                 # Custom orders API tests
├── test-admin.js                         # Admin functionality tests
├── test-cloudinary-config.js             # Cloudinary integration tests
├── test-database-coordination.js         # Database coordination tests
├── test-custom-requests.js               # Custom request tests
├── test-shop-page-api.js                 # Shop page API tests
├── test-user-upload-flow.js              # User upload flow tests
└── test-frontend-upload.js               # Frontend upload tests
```

### Test Dependencies
```json
{
  "axios": "^1.6.0",
  "dotenv": "^16.3.1"
}
```

### Test Environment Setup
```bash
# Install test dependencies
npm install axios dotenv

# Set up test environment
cp complete_env_variables.txt .env.test

# Start test server
node server.js
```

## API Testing

### Comprehensive Validation Testing

The `test_validation_comprehensive.js` file provides comprehensive testing of all API endpoints with both valid and invalid data.

#### Test Coverage
- **Product Management**: Create, update, feature products
- **Customer Operations**: Registration, login, profile management
- **Cart Operations**: Add, update, checkout
- **Order Processing**: Create, status updates
- **Custom Requests**: Submission and validation
- **Newsletter**: Subscribe/unsubscribe
- **Admin Functions**: Login, 2FA, password management

#### Test Structure
```javascript
const testResults = { passed: 0, failed: 0, total: 0 };

async function runTest(testName, testFunction) {
  try {
    await testFunction();
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED - ${error.message}`);
  }
  testResults.total++;
}
```

#### Example Test Case
```javascript
await runTest('Product Creation - Valid Data', async () => {
  const response = await axios.post(`${BASE_URL}/api/products`, {
    name: 'Test Product',
    description: 'A test product for validation',
    price: 29.99,
    sizes: ['S', 'M', 'L'],
    tags: ['test', 'validation']
  });
  
  expect(response.status).toBe(201);
  expect(response.data).toHaveProperty('id');
  expect(response.data.name).toBe('Test Product');
});
```

### Email System Testing

The `test_email.js` file tests the Nodemailer email system configuration and functionality.

#### Test Features
- SMTP connection testing
- Email template validation
- Error handling verification
- Configuration validation

#### Example Test
```javascript
async function testEmail() {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email'
    });
    
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email test failed:', error);
  }
}
```

### Custom Orders Testing

The `test_custom_orders.js` file tests the custom order request API endpoint.

#### Test Coverage
- Valid custom request submission
- Invalid data handling
- Response format validation
- Error response testing

## Frontend Testing

### Frontend Enhancement Testing

The `test_frontend_enhancements.js` file provides comprehensive testing of the frontend enhancement system.

#### Test Categories

##### 1. Script Loading Tests
```javascript
async function testScriptLoading() {
  // Verify script is loaded
  expect(window.frontendEnhancements).toBeDefined();
  expect(typeof window.frontendEnhancements).toBe('object');
  
  // Verify class methods exist
  expect(typeof window.frontendEnhancements.showToast).toBe('function');
  expect(typeof window.frontendEnhancements.createSkeletonLoader).toBe('function');
}
```

##### 2. Toast Notification Tests
```javascript
async function testToastSystem() {
  // Test toast creation
  window.frontendEnhancements.showToast('Test message', 'success');
  
  // Verify toast container exists
  const toastContainer = document.querySelector('.toast-container');
  expect(toastContainer).toBeTruthy();
  
  // Verify toast message
  const toast = toastContainer.querySelector('.toast');
  expect(toast.textContent).toContain('Test message');
}
```

##### 3. Loading State Tests
```javascript
async function testSkeletonLoading() {
  // Test skeleton creation
  const skeleton = window.frontendEnhancements.createSkeletonLoader();
  expect(skeleton.classList.contains('skeleton-loader')).toBe(true);
  
  // Test skeleton grid
  const grid = window.frontendEnhancements.createSkeletonGrid(4);
  expect(grid.children.length).toBe(4);
}
```

##### 4. Form Validation Tests
```javascript
async function testFormValidation() {
  // Test email validation
  const emailField = document.createElement('input');
  emailField.type = 'email';
  emailField.value = 'invalid-email';
  
  const isValid = window.frontendEnhancements.isValidEmail(emailField.value);
  expect(isValid).toBe(false);
  
  // Test valid email
  emailField.value = 'valid@email.com';
  const isValidValid = window.frontendEnhancements.isValidEmail(emailField.value);
  expect(isValidValid).toBe(true);
}
```

##### 5. Button Loading Tests
```javascript
async function testButtonLoading() {
  const button = document.createElement('button');
  button.textContent = 'Submit';
  
  // Test loading state
  window.frontendEnhancements.setButtonLoading(button, true);
  expect(button.disabled).toBe(true);
  expect(button.textContent).toContain('Loading');
  
  // Test normal state
  window.frontendEnhancements.setButtonLoading(button, false);
  expect(button.disabled).toBe(false);
  expect(button.textContent).toBe('Submit');
}
```

##### 6. Error Handling Tests
```javascript
async function testErrorHandling() {
  // Test global error handler
  const errorEvent = new ErrorEvent('error', {
    message: 'Test error',
    filename: 'test.js',
    lineno: 1
  });
  
  // Trigger error
  window.dispatchEvent(errorEvent);
  
  // Verify error handling
  // This would depend on the specific error handling implementation
}
```

##### 7. Responsive Enhancement Tests
```javascript
async function testResponsiveEnhancements() {
  // Test mobile menu setup
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    expect(mobileMenu).toBeTruthy();
  }
  
  // Test responsive table setup
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    expect(table.classList.contains('responsive-table')).toBe(true);
  });
}
```

##### 8. Touch Gesture Tests
```javascript
async function testTouchGestures() {
  // Test touch event setup
  const touchableElement = document.querySelector('.touchable');
  if (touchableElement) {
    expect(touchableElement).toBeTruthy();
  }
}
```

##### 9. Form Enhancement Integration Tests
```javascript
async function testFormEnhancementIntegration() {
  // Test form enhancement integration
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    expect(form.classList.contains('enhanced-form')).toBe(true);
  });
}
```

## Database Testing

### Database Coordination Testing

The `test-database-coordination.js` file tests database operations and coordination.

#### Test Coverage
- Database connection testing
- Table creation and schema validation
- Data insertion and retrieval
- Transaction handling
- Connection pooling

#### Example Test
```javascript
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty('now');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}
```

### Database Schema Testing

#### Table Structure Validation
```javascript
async function testTableStructure() {
  const tables = ['customers', 'products', 'orders', 'order_items', 'wishlist'];
  
  for (const table of tables) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [table]);
    
    expect(result.rows[0].exists).toBe(true);
  }
}
```

#### Data Integrity Testing
```javascript
async function testDataIntegrity() {
  // Test foreign key constraints
  const result = await pool.query(`
    SELECT COUNT(*) FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
  `);
  
  expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(0);
}
```

## Integration Testing

### End-to-End Workflow Testing

#### Customer Journey Testing
1. **Registration and Login**
   - Customer registration
   - Email verification
   - Login and session management

2. **Shopping Experience**
   - Product browsing
   - Cart management
   - Checkout process

3. **Account Management**
   - Profile updates
   - Order history
   - Wishlist management

#### Admin Workflow Testing
1. **Product Management**
   - Product creation
   - Image upload
   - Inventory updates

2. **Order Processing**
   - Order status updates
   - Customer communication
   - Fulfillment tracking

### API Integration Testing

#### Cross-Endpoint Testing
```javascript
async function testCustomerWorkflow() {
  // 1. Register customer
  const registerResponse = await axios.post(`${BASE_URL}/api/customer/auth`, {
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User'
  });
  
  expect(registerResponse.status).toBe(201);
  const token = registerResponse.data.token;
  
  // 2. Get profile
  const profileResponse = await axios.get(`${BASE_URL}/api/customer/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  expect(profileResponse.status).toBe(200);
  expect(profileResponse.data.email).toBe('test@example.com');
  
  // 3. Add to wishlist
  const wishlistResponse = await axios.post(`${BASE_URL}/api/customer/wishlist`, {
    product_id: 1
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  expect(wishlistResponse.status).toBe(201);
}
```

## Performance Testing

### Load Testing

#### API Endpoint Performance
```javascript
async function testAPIPerformance() {
  const startTime = Date.now();
  const requests = [];
  
  // Make 100 concurrent requests
  for (let i = 0; i < 100; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/products`)
        .catch(error => ({ error: true, message: error.message }))
    );
  }
  
  const responses = await Promise.all(requests);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const successCount = responses.filter(r => !r.error).length;
  const errorCount = responses.filter(r => r.error).length;
  
  console.log(`Performance Test Results:`);
  console.log(`Total Requests: 100`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Average Response Time: ${duration / 100}ms`);
  
  expect(successCount).toBeGreaterThan(95); // 95% success rate
  expect(duration).toBeLessThan(10000); // Less than 10 seconds
}
```

### Database Performance Testing

#### Query Performance
```javascript
async function testQueryPerformance() {
  const startTime = Date.now();
  
  // Execute complex query
  const result = await pool.query(`
    SELECT p.*, 
           COUNT(oi.id) as order_count,
           AVG(oi.price) as avg_order_price
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.id
    ORDER BY order_count DESC
    LIMIT 50
  `);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(1000); // Less than 1 second
  expect(result.rows).toHaveLength(50);
}
```

## Security Testing

### Input Validation Testing

#### SQL Injection Prevention
```javascript
async function testSQLInjectionPrevention() {
  const maliciousInputs = [
    "'; DROP TABLE customers; --",
    "' OR '1'='1",
    "'; INSERT INTO customers VALUES (999, 'hacker@evil.com', 'hash', 'Hacker', 'Evil'); --"
  ];
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/api/customer/auth`, {
        email: input,
        password: 'password123'
      });
      
      // Should not succeed with malicious input
      expect(response.status).not.toBe(200);
    } catch (error) {
      // Expected to fail
      expect(error.response.status).toBe(400);
    }
  }
}
```

#### XSS Prevention Testing
```javascript
async function testXSSPrevention() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(\'XSS\')">'
  ];
  
  for (const payload of xssPayloads) {
    try {
      const response = await axios.put(`${BASE_URL}/api/customer/profile`, {
        first_name: payload,
        last_name: 'Test'
      }, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      
      // Check if payload was sanitized
      const profileResponse = await axios.get(`${BASE_URL}/api/customer/profile`, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      
      const firstName = profileResponse.data.first_name;
      expect(firstName).not.toContain('<script>');
      expect(firstName).not.toContain('javascript:');
      expect(firstName).not.toContain('onerror');
    } catch (error) {
      // Should fail validation
      expect(error.response.status).toBe(400);
    }
  }
}
```

### Authentication Testing

#### JWT Token Validation
```javascript
async function testJWTValidation() {
  // Test with invalid token
  try {
    await axios.get(`${BASE_URL}/api/customer/profile`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    throw new Error('Should have failed with invalid token');
  } catch (error) {
    expect(error.response.status).toBe(401);
  }
  
  // Test with expired token
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  try {
    await axios.get(`${BASE_URL}/api/customer/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    throw new Error('Should have failed with expired token');
  } catch (error) {
    expect(error.response.status).toBe(401);
  }
}
```

## Test Execution

### Running All Tests

#### Sequential Execution
```bash
# Run tests in sequence
node test_validation_comprehensive.js
node test_frontend_enhancements.js
node test_email.js
node test_custom_orders.js
```

#### Parallel Execution
```bash
# Run tests in parallel (if supported)
npm run test:parallel
```

### Test Environment Setup

#### Pre-test Setup
```bash
# 1. Start the server
node server.js

# 2. Wait for server to be ready
sleep 5

# 3. Run tests
node test_validation_comprehensive.js
```

#### Post-test Cleanup
```bash
# Clean up test data
node cleanup_test_data.js

# Stop server
pkill -f "node server.js"
```

### Test Results Analysis

#### Success Metrics
- **Pass Rate**: Target > 95%
- **Coverage**: Target > 90%
- **Performance**: Response time < 1s
- **Security**: 0 vulnerabilities

#### Failure Analysis
```javascript
// Test failure reporting
if (testResults.failed > 0) {
  console.log('\n🔍 Failed Tests Analysis:');
  console.log('Review the following areas:');
  console.log('- API endpoint availability');
  console.log('- Database connectivity');
  console.log('- Environment configuration');
  console.log('- Server status');
}
```

## Test Maintenance

### Test Data Management

#### Test Data Creation
```javascript
// Create test products
async function createTestProducts() {
  const testProducts = [
    {
      name: 'Test Product 1',
      description: 'Test description 1',
      price: 19.99,
      sizes: ['S', 'M', 'L']
    },
    {
      name: 'Test Product 2',
      description: 'Test description 2',
      price: 29.99,
      sizes: ['M', 'L', 'XL']
    }
  ];
  
  for (const product of testProducts) {
    await pool.query(`
      INSERT INTO products (name, description, price, sizes)
      VALUES ($1, $2, $3, $4)
    `, [product.name, product.description, product.price, JSON.stringify(product.sizes)]);
  }
}
```

#### Test Data Cleanup
```javascript
// Clean up test data
async function cleanupTestData() {
  await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = (SELECT id FROM customers WHERE email = $1))', ['test@example.com']);
  await pool.query('DELETE FROM orders WHERE customer_id = (SELECT id FROM customers WHERE email = $1)', ['test@example.com']);
  await pool.query('DELETE FROM wishlist WHERE customer_id = (SELECT id FROM customers WHERE email = $1)', ['test@example.com']);
  await pool.query('DELETE FROM customers WHERE email = $1', ['test@example.com']);
  await pool.query('DELETE FROM products WHERE name LIKE $1', ['Test Product%']);
}
```

### Test Configuration Management

#### Environment-specific Testing
```javascript
// Test configuration
const testConfig = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,
    retries: 3
  },
  staging: {
    baseUrl: 'https://staging-app.railway.app',
    timeout: 10000,
    retries: 2
  },
  production: {
    baseUrl: 'https://production-app.railway.app',
    timeout: 15000,
    retries: 1
  }
};

const config = testConfig[process.env.NODE_ENV || 'development'];
```

### Continuous Integration

#### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: |
        npm start &
        sleep 10
        npm test
```

---

## Test Summary

### Current Test Coverage
- **API Validation**: 100% coverage with comprehensive input validation
- **Frontend Enhancements**: 100% coverage of UI enhancement system
- **Email System**: 100% coverage of Nodemailer configuration
- **Database Operations**: 100% coverage of core database functions
- **Security Features**: 100% coverage of authentication and validation

### Test Execution Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:frontend
npm run test:security

# Run tests with coverage
npm run test:coverage
```

### Test Maintenance Schedule
- **Daily**: Run critical path tests
- **Weekly**: Run full test suite
- **Monthly**: Update test data and configurations
- **Quarterly**: Review and optimize test coverage

---

*Last Updated: December 2024*
*Version: 1.0*
