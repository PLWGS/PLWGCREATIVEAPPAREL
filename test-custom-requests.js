const http = require('http');

async function testCustomRequests() {
    try {
        console.log('🧪 Testing custom requests endpoint...');

        const testData = {
            fullName: "Test User",
            email: "test@example.com",
            concept: "Test design concept",
            productType: "t-shirt",
            quantity: "1",
            budget: "50-100"
        };

        const postData = JSON.stringify(testData);

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/custom-requests',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            console.log('📊 Response status:', res.statusCode);
            console.log('📊 Response headers:', res.headers);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('📊 Response body:', JSON.stringify(result, null, 2));

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ Custom requests endpoint is working!');
                    } else {
                        console.log('❌ Custom requests endpoint failed:', result.error);
                    }
                } catch (error) {
                    console.log('❌ Failed to parse response:', data);
                    console.log('❌ Parse error:', error.message);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request failed:', error.message);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCustomRequests(); 