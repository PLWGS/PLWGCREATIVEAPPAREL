const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = require('form-data');
const fs = require('fs');

async function testCustomRequestForm() {
    console.log('🧪 Testing Custom Request Form Fixes...\n');
    
    try {
        // Test 1: Check if the custom page loads without errors
        console.log('1️⃣ Testing page load...');
        const pageResponse = await fetch('http://localhost:3000/pages/custom.html');
        if (pageResponse.ok) {
            console.log('✅ Custom page loads successfully');
        } else {
            console.log('❌ Custom page failed to load');
            return false;
        }
        
        // Test 2: Test form submission with valid data
        console.log('\n2️⃣ Testing form submission...');
        
        // Create a simple test image (1x1 pixel PNG)
        const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const formData = new FormData();
        formData.append('customerName', 'Test User');
        formData.append('customerEmail', 'test.fixes@example.com');
        formData.append('phoneNumber', '555-1234');
        formData.append('productType', 'T-Shirt');
        formData.append('quantity', '2-5 pieces');
        formData.append('budget', '$50 - $100');
        formData.append('timeline', '2-4 weeks');
        formData.append('description', 'Test custom order for fixing bugs');
        formData.append('stylePreferences', JSON.stringify(['Modern', 'Minimalist']));
        formData.append('sizeRequirements', JSON.stringify(['M', 'L']));
        formData.append('referenceImages', JSON.stringify([{
            name: 'test-image.png',
            data: testImageData,
            size: 95,
            type: 'image/png'
        }]));
        
        const submitResponse = await fetch('http://localhost:3000/api/custom-requests', {
            method: 'POST',
            body: formData
        });
        
        if (submitResponse.ok) {
            const result = await submitResponse.json();
            console.log('✅ Form submission successful');
            console.log('📝 Response:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await submitResponse.text();
            console.log('❌ Form submission failed');
            console.log('🚨 Error response:', errorText);
            return false;
        }
        
        // Test 3: Verify database entry was created
        console.log('\n3️⃣ Testing database entry retrieval...');
        const retrieveResponse = await fetch('http://localhost:3000/api/custom-requests/customer/test.fixes@example.com');
        
        if (retrieveResponse.ok) {
            const orders = await retrieveResponse.json();
            console.log('✅ Database entry retrieved successfully');
            console.log('📊 Found orders:', orders.length);
            
            if (orders.length > 0) {
                const latestOrder = orders[orders.length - 1];
                console.log('🔍 Latest order details:');
                console.log('   - Customer:', latestOrder.customer_name);
                console.log('   - Product:', latestOrder.product_type);
                console.log('   - Quantity:', latestOrder.quantity);
                console.log('   - Budget:', latestOrder.budget_range);
                console.log('   - Timeline:', latestOrder.timeline);
                console.log('   - Images:', latestOrder.reference_images?.length || 0);
            }
        } else {
            console.log('❌ Failed to retrieve database entry');
            return false;
        }
        
        console.log('\n🎉 All tests passed! The custom request form is working correctly.');
        return true;
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('📚 Error stack:', error.stack);
        return false;
    }
}

// Run the test
testCustomRequestForm().then(success => {
    if (success) {
        console.log('\n🚀 Ready to commit and push changes!');
        process.exit(0);
    } else {
        console.log('\n❌ Tests failed. Please fix issues before committing.');
        process.exit(1);
    }
});
