/**
 * PLWGCREATIVEAPPAREL - Frontend Enhancement Testing
 * Phase 2: Frontend Polish and Testing
 * 
 * This script tests all the frontend enhancements implemented in Phase 2
 */

const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

async function runTest(testName, testFunction) {
    console.log(`🧪 Running: ${testName}`);
    try {
        await testFunction();
        console.log(`✅ ${testName}: PASSED`);
        testResults.passed++;
    } catch (error) {
        console.log(`❌ ${testName}: FAILED - ${error.message}`);
        testResults.failed++;
    }
    testResults.total++;
    console.log('');
}

// Test 1: Frontend Enhancements Script Loading
async function testScriptLoading() {
    // Check if the frontend enhancements script is loaded
    if (!window.frontendEnhancements) {
        throw new Error('Frontend enhancements script not loaded');
    }
    
    // Check if the class has the expected methods
    const requiredMethods = [
        'showToast', 'createSkeletonLoader', 'setButtonLoading',
        'validateField', 'setupGlobalErrorHandling'
    ];
    
    requiredMethods.forEach(method => {
        if (typeof window.frontendEnhancements[method] !== 'function') {
            throw new Error(`Method ${method} not found`);
        }
    });
}

// Test 2: Toast Notification System
async function testToastSystem() {
    const enhancements = window.frontendEnhancements;
    
    // Test toast creation
    enhancements.showToast('Test success message', 'success');
    enhancements.showToast('Test error message', 'error');
    enhancements.showToast('Test warning message', 'warning');
    enhancements.showToast('Test info message', 'info');
    
    // Check if toast container exists
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        throw new Error('Toast container not created');
    }
    
    // Check if toasts were created
    const toasts = toastContainer.querySelectorAll('div');
    if (toasts.length === 0) {
        throw new Error('No toasts were created');
    }
    
    // Wait for toasts to auto-remove
    await new Promise(resolve => setTimeout(resolve, 6000));
}

// Test 3: Skeleton Loading System
async function testSkeletonLoading() {
    const enhancements = window.frontendEnhancements;
    
    // Test skeleton card creation
    const skeletonCard = enhancements.createSkeletonCard('test-class');
    if (!skeletonCard.includes('skeleton-card')) {
        throw new Error('Skeleton card not created correctly');
    }
    
    // Test skeleton grid creation
    const skeletonGrid = enhancements.createSkeletonGrid(3, 'test-grid');
    if (!skeletonGrid.includes('skeleton-card')) {
        throw new Error('Skeleton grid not created correctly');
    }
    
    // Check if skeleton styles are injected
    const skeletonStyles = document.querySelector('style');
    if (!skeletonStyles || !skeletonStyles.textContent.includes('skeleton-loading')) {
        throw new Error('Skeleton styles not injected');
    }
}

// Test 4: Form Validation System
async function testFormValidation() {
    const enhancements = window.frontendEnhancements;
    
    // Create a test form
    const testForm = document.createElement('form');
    testForm.innerHTML = `
        <input type="email" id="test-email" required />
        <input type="password" id="test-password" required />
        <input type="tel" id="test-phone" />
    `;
    document.body.appendChild(testForm);
    
    const emailInput = testForm.querySelector('#test-email');
    const passwordInput = testForm.querySelector('#test-password');
    const phoneInput = testForm.querySelector('#test-phone');
    
    // Test email validation
    emailInput.value = 'invalid-email';
    enhancements.validateField(emailInput);
    if (!emailInput.classList.contains('border-red-500')) {
        throw new Error('Email validation not working');
    }
    
    // Test valid email
    emailInput.value = 'test@example.com';
    enhancements.validateField(emailInput);
    if (!emailInput.classList.contains('border-green-500')) {
        throw new Error('Valid email not recognized');
    }
    
    // Test password validation
    passwordInput.value = '123';
    enhancements.validateField(passwordInput);
    if (!passwordInput.classList.contains('border-red-500')) {
        throw new Error('Password validation not working');
    }
    
    // Test valid password
    passwordInput.value = 'password123';
    enhancements.validateField(passwordInput);
    if (!passwordInput.classList.contains('border-green-500')) {
        throw new Error('Valid password not recognized');
    }
    
    // Clean up
    document.body.removeChild(testForm);
}

// Test 5: Button Loading States
async function testButtonLoading() {
    const enhancements = window.frontendEnhancements;
    
    // Create a test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Submit';
    document.body.appendChild(testButton);
    
    // Test loading state
    enhancements.setButtonLoading(testButton, true);
    if (!testButton.disabled || !testButton.innerHTML.includes('Loading...')) {
        throw new Error('Button loading state not working');
    }
    
    // Test normal state
    enhancements.setButtonLoading(testButton, false);
    if (testButton.disabled || testButton.innerHTML.includes('Loading...')) {
        throw new Error('Button normal state not working');
    }
    
    // Clean up
    document.body.removeChild(testButton);
}

// Test 6: Error Handling System
async function testErrorHandling() {
    const enhancements = window.frontendEnhancements;
    
    // Test global error handling
    const originalFetch = window.fetch;
    let errorCaught = false;
    
    // Mock fetch to return error
    window.fetch = async () => {
        return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Test error message' })
        };
    };
    
    try {
        await enhancements.enhanceApiResponse(
            await window.fetch('/test'),
            'Success message'
        );
    } catch (error) {
        errorCaught = true;
    }
    
    if (!errorCaught) {
        throw new Error('Error handling not working');
    }
    
    // Restore original fetch
    window.fetch = originalFetch;
}

// Test 7: Responsive Enhancements
async function testResponsiveEnhancements() {
    const enhancements = window.frontendEnhancements;
    
    // Test mobile menu setup
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'lg:hidden';
    const desktopNav = document.createElement('div');
    desktopNav.className = 'hidden lg:flex';
    
    document.body.appendChild(mobileMenuBtn);
    document.body.appendChild(desktopNav);
    
    // Trigger mobile menu setup
    enhancements.setupMobileMenu();
    
    // Check if event listener was added
    const clickEvent = new Event('click');
    mobileMenuBtn.dispatchEvent(clickEvent);
    
    // Clean up
    document.body.removeChild(mobileMenuBtn);
    document.body.removeChild(desktopNav);
}

// Test 8: API Response Enhancement
async function testApiResponseEnhancement() {
    const enhancements = window.frontendEnhancements;
    
    // Test successful response
    const successResponse = {
        ok: true,
        json: async () => ({ data: 'test' })
    };
    
    const result = await enhancements.enhanceApiResponse(
        successResponse,
        'Test success'
    );
    
    if (!result || !result.data) {
        throw new Error('API response enhancement not working for success');
    }
    
    // Test error response
    const errorResponse = {
        ok: false,
        json: async () => ({ error: 'Test error' })
    };
    
    let errorCaught = false;
    try {
        await enhancements.enhanceApiResponse(errorResponse, 'Test success');
    } catch (error) {
        errorCaught = true;
    }
    
    if (!errorCaught) {
        throw new Error('API response enhancement not working for errors');
    }
}

// Test 9: Touch Gesture Support
async function testTouchGestures() {
    const enhancements = window.frontendEnhancements;
    
    // Test touch gesture setup
    enhancements.setupTouchGestures();
    
    // Create touch events
    const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
    });
    
    const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50, clientY: 100 }]
    });
    
    // Dispatch events
    document.dispatchEvent(touchStartEvent);
    document.dispatchEvent(touchEndEvent);
    
    // If no errors, test passes
    console.log('Touch gestures setup completed');
}

// Test 10: Form Enhancement Integration
async function testFormEnhancementIntegration() {
    const enhancements = window.frontendEnhancements;
    
    // Create a test form with submit button
    const testForm = document.createElement('form');
    testForm.innerHTML = `
        <input type="text" name="test-field" required />
        <button type="submit">Submit Form</button>
    `;
    document.body.appendChild(testForm);
    
    const submitBtn = testForm.querySelector('button[type="submit"]');
    
    // Test form submission handling
    const submitEvent = new Event('submit');
    testForm.dispatchEvent(submitEvent);
    
    // Check if button loading state was applied
    if (!submitBtn.disabled) {
        throw new Error('Form submission loading state not working');
    }
    
    // Clean up
    document.body.removeChild(testForm);
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Frontend Enhancement Tests...\n');
    
    await runTest('Script Loading', testScriptLoading);
    await runTest('Toast Notification System', testToastSystem);
    await runTest('Skeleton Loading System', testSkeletonLoading);
    await runTest('Form Validation System', testFormValidation);
    await runTest('Button Loading States', testButtonLoading);
    await runTest('Error Handling System', testErrorHandling);
    await runTest('Responsive Enhancements', testResponsiveEnhancements);
    await runTest('API Response Enhancement', testApiResponseEnhancement);
    await runTest('Touch Gesture Support', testTouchGestures);
    await runTest('Form Enhancement Integration', testFormEnhancementIntegration);
    
    console.log('📊 Frontend Enhancement Test Results:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All frontend enhancement tests passed! Phase 2 is ready.');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the implementation.');
    }
}

// Run tests when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testResults };
}
