const axios = require('axios');

async function createPermanentTestProduct() {
    try {
        // Login
        const authResponse = await axios.post('http://localhost:3000/api/admin/login', {
            email: 'admin@plwgscreativeapparel.com',
            password: 'password'
        });
        
        const token = authResponse.data.token;
        
        // Create a permanent test product with images
        const uploadedImages = [
            {
                name: 'test-product-main.jpg',
                data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
            },
            {
                name: 'test-product-sub.jpg',
                data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
            }
        ];
        
        const productData = {
            name: 'PERMANENT TEST PRODUCT - VISIBLE ON SHOP',
            description: 'This is a permanent test product to verify that the shop page is working correctly. You should see this product on your shop page with a Cloudinary image.',
            price: 19.99,
            category: 'T-Shirts',
            stock_quantity: 50,
            colors: ['Black', 'White'],
            sizes: ['S', 'M', 'L'],
            images: uploadedImages,
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
                fade_resistant: true
            },
            tags: ['test', 'permanent', 'shop-verification']
        };
        
        const response = await axios.post('http://localhost:3000/api/admin/products', productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ PERMANENT TEST PRODUCT CREATED SUCCESSFULLY!');
        console.log('Product ID:', response.data.product.id);
        console.log('Product Name:', response.data.product.name);
        console.log('Image URL:', response.data.product.image_url);
        console.log('Sub Images:', response.data.product.sub_images);
        
        console.log('\n📋 INSTRUCTIONS FOR USER:');
        console.log('1. Go to your shop page: http://localhost:3000/pages/shop.html');
        console.log('2. You should see this product: "PERMANENT TEST PRODUCT - VISIBLE ON SHOP"');
        console.log('3. The product should have a Cloudinary image (not a placeholder)');
        console.log('4. If you see this product, the system is working correctly');
        console.log('5. If you do NOT see this product, there is a frontend display issue');
        
        return response.data.product.id;
        
    } catch (error) {
        console.error('❌ Error creating permanent test product:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

createPermanentTestProduct(); 