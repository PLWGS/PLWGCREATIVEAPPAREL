const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDebugCustomAPI() {
    console.log('🔍 Debug Testing Custom Request API...\n');
    
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
        
        // Test 2: Test API endpoint with minimal data and detailed error logging
        console.log('\n2️⃣ Testing API endpoint with detailed logging...');
        
        const testData = {
            fullName: 'Test User',
            email: 'test.debug@example.com',
            phone: '555-1234',
            productType: 'T-Shirt',
            quantity: '2-5',
            budget: '50-100',
            timeline: 'standard',
            concept: 'Debug test order',
            styles: ['Modern'],
            sizes: ['M'],
            colors: null,
            notes: null,
            referenceImages: []
        };
        
        console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
        
        const submitResponse = await fetch('http://localhost:3000/api/custom-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Response status:', submitResponse.status);
        console.log('📊 Response headers:', Object.fromEntries(submitResponse.headers.entries()));
        
        const responseText = await submitResponse.text();
        console.log('📝 Full response body:', responseText);
        
        if (submitResponse.ok) {
            try {
                const result = JSON.parse(responseText);
                console.log('✅ API endpoint working');
                console.log('📝 Parsed response:', JSON.stringify(result, null, 2));
            } catch (parseError) {
                console.log('⚠️ Response is not valid JSON:', parseError.message);
            }
        } else {
            console.log('❌ API endpoint failed');
            console.log('🚨 Error response:', responseText);
            
            // Try to parse error as JSON for more details
            try {
                const errorResult = JSON.parse(responseText);
                if (errorResult.error) {
                    console.log('🚨 Error message:', errorResult.error);
                }
                if (errorResult.details) {
                    console.log('🚨 Error details:', errorResult.details);
                }
            } catch (parseError) {
                console.log('⚠️ Error response is not valid JSON');
            }
        }
        
        return submitResponse.ok;
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('📚 Error stack:', error.stack);
        return false;
    }
}

// Run the test
testDebugCustomAPI().then(success => {
    if (success) {
        console.log('\n🎉 API endpoint is working correctly!');
        process.exit(0);
    } else {
        console.log('\n❌ API test failed. Please check server logs.');
        process.exit(1);
    }
});
