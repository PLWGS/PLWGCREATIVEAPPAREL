const axios = require('axios');

async function testShopPageAPI() {
    console.log('🔍 Testing shop page API...\n');
    
    try {
        // Test the public products API (same endpoint used by shop page)
        console.log('1️⃣ Testing /api/products/public endpoint...');
        const response = await axios.get('http://localhost:3000/api/products/public');
        
        if (response.data && Array.isArray(response.data)) {
            console.log('✅ API returned products successfully');
            console.log('📦 Total products:', response.data.length);
            
            // Look for our test product
            const testProduct = response.data.find(p => p.name === 'PERMANENT TEST PRODUCT - VISIBLE ON SHOP');
            
            if (testProduct) {
                console.log('✅ Test product found in API response!');
                console.log('📸 Product ID:', testProduct.id);
                console.log('📸 Product Name:', testProduct.name);
                console.log('📸 Product Price:', testProduct.price);
                console.log('📸 Product Image URL:', testProduct.image_url);
                console.log('📸 Product Sub Images:', testProduct.sub_images);
                
                if (testProduct.image_url && testProduct.image_url.startsWith('https://res.cloudinary.com')) {
                    console.log('✅ Product has Cloudinary image URL!');
                } else {
                    console.log('❌ Product does not have Cloudinary image URL');
                }
            } else {
                console.log('❌ Test product not found in API response');
                console.log('📋 Available products:');
                response.data.forEach((product, index) => {
                    console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
                });
            }
            
            // Check all products for Cloudinary images
            const productsWithCloudinaryImages = response.data.filter(p => 
                p.image_url && p.image_url.startsWith('https://res.cloudinary.com')
            );
            
            console.log(`\n📸 Products with Cloudinary images: ${productsWithCloudinaryImages.length}/${response.data.length}`);
            
            productsWithCloudinaryImages.forEach((product, index) => {
                console.log(`  ${index + 1}. ${product.name} - ${product.image_url}`);
            });
            
        } else {
            console.log('❌ API did not return products array');
            console.log('Response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error testing shop page API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testShopPageAPI(); 