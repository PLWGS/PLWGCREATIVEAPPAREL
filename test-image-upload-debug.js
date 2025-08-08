const axios = require('axios');

async function testImageUpload() {
    console.log('🔍 Starting comprehensive image upload debug test...\n');
    
    try {
        // Step 1: Test authentication
        console.log('1️⃣ Testing authentication...');
        const authResponse = await axios.post('http://localhost:3000/api/admin/login', {
            email: 'admin@plwgscreativeapparel.com',
            password: 'password'
        });
        
        if (!authResponse.data.token) {
            throw new Error('Authentication failed');
        }
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful\n');
        
        // Step 2: Create a test product with images
        console.log('2️⃣ Testing product creation with images...');
        
        // Create a simple test image (base64 SVG)
        const testImage = {
            name: 'test-image.svg',
            data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
        };
        
        const productData = {
            name: 'Debug Test Product',
            description: 'This is a test product to debug image uploads',
            price: 29.99,
            category: 'T-Shirts',
            stock_quantity: 50,
            colors: ['Black'],
            sizes: ['M'],
            images: [testImage],
            specifications: {
                material: 'Cotton',
                weight: '180g',
                fit: 'Regular'
            },
            features: {
                preshrunk: true,
                double_stitched: true
            },
            tags: ['test', 'debug']
        };
        
        console.log('📤 Sending product data with image...');
        console.log('Image data length:', testImage.data.length);
        console.log('Image data preview:', testImage.data.substring(0, 100) + '...');
        
        const createResponse = await axios.post('http://localhost:3000/api/admin/products', productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (createResponse.data.product) {
            const productId = createResponse.data.product.id;
            console.log('✅ Product created successfully with ID:', productId);
            console.log('Product data:', JSON.stringify(createResponse.data.product, null, 2));
            
            // Step 3: Test retrieving the product
            console.log('\n3️⃣ Testing product retrieval...');
            const getResponse = await axios.get(`http://localhost:3000/api/admin/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (getResponse.data) {
                console.log('✅ Product retrieved successfully');
                console.log('Retrieved product data:', JSON.stringify(getResponse.data, null, 2));
                
                // Check if images are present
                if (getResponse.data.image_url) {
                    console.log('✅ Main image URL found:', getResponse.data.image_url);
                } else {
                    console.log('❌ No main image URL found');
                }
                
                if (getResponse.data.sub_images && getResponse.data.sub_images.length > 0) {
                    console.log('✅ Sub images found:', getResponse.data.sub_images.length);
                } else {
                    console.log('❌ No sub images found');
                }
            } else {
                console.log('❌ Failed to retrieve product');
            }
            
            // Step 4: Test public product endpoint
            console.log('\n4️⃣ Testing public product endpoint...');
            const publicResponse = await axios.get(`http://localhost:3000/api/products/public/${productId}`);
            
            if (publicResponse.data) {
                console.log('✅ Public product retrieved successfully');
                console.log('Public product data:', JSON.stringify(publicResponse.data, null, 2));
            } else {
                console.log('❌ Failed to retrieve public product');
            }
            
            // Step 5: Clean up - delete the test product
            console.log('\n5️⃣ Cleaning up test product...');
            const deleteResponse = await axios.delete(`http://localhost:3000/api/admin/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (deleteResponse.data) {
                console.log('✅ Test product deleted successfully');
            } else {
                console.log('❌ Failed to delete test product');
            }
            
        } else {
            console.log('❌ Product creation failed');
            console.log('Response:', createResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testImageUpload(); 