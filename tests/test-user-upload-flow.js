const axios = require('axios');

async function testUserUploadFlow() {
    console.log('🔍 Testing complete user upload flow...\n');
    
    try {
        // Step 1: Login as admin
        console.log('1️⃣ Logging in as admin...');
        const authResponse = await axios.post('http://localhost:3000/api/admin/login', {
            email: 'admin@plwgscreativeapparel.com',
            password: 'password'
        });
        
        if (!authResponse.data.token) {
            throw new Error('Authentication failed');
        }
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful\n');
        
        // Step 2: Create a product with images (simulating user upload)
        console.log('2️⃣ Creating product with images (simulating user upload)...');
        
        // Simulate the exact data structure that the frontend sends
        const uploadedImages = [
            {
                name: 'user-uploaded-image-1.jpg',
                data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
            },
            {
                name: 'user-uploaded-image-2.jpg',
                data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
            }
        ];
        
        const productData = {
            name: 'User Upload Test Product',
            description: 'This product was created through the admin interface with user-uploaded images',
            price: 29.99,
            category: 'T-Shirts',
            stock_quantity: 75,
            colors: ['Black', 'White'],
            sizes: ['S', 'M', 'L', 'XL'],
            images: uploadedImages, // This is exactly what the frontend sends
            specifications: {
                material: '100% Cotton',
                weight: '180g',
                fit: 'Regular Fit',
                neck_style: 'Crew Neck',
                sleeve_length: 'Short Sleeve',
                origin: 'Made in USA'
            },
            features: {
                preshrunk: true,
                double_stitched: true,
                fade_resistant: true,
                soft_touch: true
            },
            tags: ['user-upload', 'test', 'admin-interface']
        };
        
        console.log('📤 Sending product data with user-uploaded images...');
        console.log('📸 Number of images:', uploadedImages.length);
        console.log('📸 First image data length:', uploadedImages[0].data.length);
        console.log('📸 First image name:', uploadedImages[0].name);
        
        const createResponse = await axios.post('http://localhost:3000/api/admin/products', productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (createResponse.data.product) {
            const productId = createResponse.data.product.id;
            console.log('✅ Product created successfully with ID:', productId);
            console.log('📦 Product data:', JSON.stringify(createResponse.data.product, null, 2));
            
            // Step 3: Check if the product appears in the public API
            console.log('\n3️⃣ Checking if product appears in public API...');
            const publicResponse = await axios.get('http://localhost:3000/api/products/public');
            
            if (publicResponse.data) {
                const products = publicResponse.data;
                const ourProduct = products.find(p => p.id === productId);
                
                if (ourProduct) {
                    console.log('✅ Product found in public API!');
                    console.log('📸 Product image URL:', ourProduct.image_url);
                    console.log('📸 Product sub images:', ourProduct.sub_images);
                    
                    if (ourProduct.image_url && ourProduct.image_url.startsWith('https://res.cloudinary.com')) {
                        console.log('✅ Product has Cloudinary image URL!');
                    } else {
                        console.log('❌ Product does not have Cloudinary image URL');
                    }
                } else {
                    console.log('❌ Product not found in public API');
                }
            } else {
                console.log('❌ No products returned from public API');
            }
            
            // Step 4: Test the shop page functionality
            console.log('\n4️⃣ Testing shop page functionality...');
            const shopPageResponse = await axios.get('http://localhost:3000/api/products/public');
            
            if (shopPageResponse.data && Array.isArray(shopPageResponse.data)) {
                console.log('✅ Shop page API working correctly');
                console.log('📦 Total products available:', shopPageResponse.data.length);
                
                const productsWithImages = shopPageResponse.data.filter(p => 
                    p.image_url && p.image_url.startsWith('https://res.cloudinary.com')
                );
                console.log('📸 Products with Cloudinary images:', productsWithImages.length);
                
                productsWithImages.forEach((product, index) => {
                    console.log(`📸 Product ${index + 1}: ${product.name} - ${product.image_url}`);
                });
            } else {
                console.log('❌ Shop page API not working correctly');
            }
            
            // Step 5: Clean up
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
testUserUploadFlow(); 