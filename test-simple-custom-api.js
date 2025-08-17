const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSimpleCustomAPI() {
    console.log('🧪 Testing Custom Request API with Simple Data...\n');
    
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
        
        // Test 2: Test API endpoint with minimal data
        console.log('\n2️⃣ Testing API endpoint...');
        
        const testData = {
            fullName: 'Test User',
            email: 'test.simple@example.com',
            phone: '555-1234',
            productType: 'T-Shirt',
            quantity: '2-5',
            budget: '50-100',
            timeline: 'standard',
            concept: 'Simple test order',
            styles: ['Modern'],
            sizes: ['M'],
            colors: null,
            notes: null,
            referenceImages: []
        };
        
        const submitResponse = await fetch('http://localhost:3000/api/custom-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        if (submitResponse.ok) {
            const result = await submitResponse.json();
            console.log('✅ API endpoint working');
            console.log('📝 Response:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await submitResponse.text();
            console.log('❌ API endpoint failed');
            console.log('🚨 Error response:', errorText);
            console.log('📊 Status:', submitResponse.status);
            return false;
        }
        
        console.log('\n🎉 API test passed!');
        return true;
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('📚 Error stack:', error.stack);
        return false;
    }
}

// Run the test
testSimpleCustomAPI().then(success => {
    if (success) {
        console.log('\n🚀 API endpoint is working correctly!');
        process.exit(0);
    } else {
        console.log('\n❌ API test failed. Please check server logs.');
        process.exit(1);
    }
});
