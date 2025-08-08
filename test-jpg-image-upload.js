require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testJPGImageUpload() {
    try {
        console.log('🧪 Testing JPG image upload and display...');
        
        // Create a simple JPG image (base64 encoded)
        const jpgImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        const testProduct = {
            name: "JPG TEST PRODUCT - SHOULD DISPLAY IMAGE",
            description: "This is a test product with JPG images to verify that images display correctly in the browser.",
            price: "24.99",
            category: "T-Shirts",
            stock_quantity: 25,
            low_stock_threshold: 5,
            colors: ["Black", "White"],
            sizes: ["S", "M", "L", "XL"],
            tags: ["test", "jpg", "image-display"],
            uploadedImages: [
                {
                    name: "test-jpg-main.jpg",
                    data: jpgImageData
                },
                {
                    name: "test-jpg-sub.jpg", 
                    data: jpgImageData
                }
            ]
        };
        
        console.log('📤 Uploading test product with JPG images...');
        
        // Get admin token first
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/login`, {
            email: 'admin@plwgscreativeapparel.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        
        // Create the product
        const createResponse = await axios.post(`${BASE_URL}/api/admin/products`, testProduct, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const productId = createResponse.data.id;
        console.log(`✅ Test product created with ID: ${productId}`);
        
        // Test the product page
        console.log(`\n🌐 Test this URL:`);
        console.log(`   http://localhost:3000/pages/product.html?id=${productId}`);
        
        console.log('\n📝 Instructions:');
        console.log('1. Open the URL above in your browser');
        console.log('2. You should see a JPG image displayed (not placeholder)');
        console.log('3. If JPG works but SVG doesn\'t, we know it\'s a format issue');
        
    } catch (error) {
        console.error('❌ Error creating test product:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testJPGImageUpload(); 