const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMinimalCustomAPI() {
    console.log('🧪 Minimal Custom Request API Test...\n');
    
    try {
        // Test with absolute minimal data
        console.log('1️⃣ Testing with minimal data...');
        
        const testData = {
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '555-1234',
            productType: 'T-Shirt',
            quantity: '2-5',
            budget: '50-100',
            timeline: 'standard',
            concept: 'Simple test',
            styles: ['Modern'],
            sizes: ['M'],
            colors: null,
            notes: null,
            referenceImages: []
        };
        
        console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch('http://localhost:3000/api/custom-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', response.headers.raw());
        
        const responseText = await response.text();
        console.log('📄 Response body:', responseText);
        
        if (response.ok) {
            console.log('✅ API test successful!');
            return true;
        } else {
            console.log('❌ API test failed');
            return false;
        }
        
    } catch (error) {
        console.error('💥 Test failed with error:', error);
        return false;
    }
}

testMinimalCustomAPI().then(success => {
    if (success) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Tests failed');
        process.exit(1);
    }
});
