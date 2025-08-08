const axios = require('axios');

async function createTestProduct() {
    try {
        // Login
        const authResponse = await axios.post('http://localhost:3000/api/admin/login', {
            email: 'admin@plwgscreativeapparel.com',
            password: 'password'
        });
        
        const token = authResponse.data.token;
        
        // Create test product with image
        const testImage = {
            name: 'test-product.jpg',
            data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik03NSA3NUgyMjVWMjI1SDc1WiIgc3Ryb2tlPSIjMDBDQ0Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTEwNSAxMzVMMTk1IDEzNUwxOTUgMTk1TDEwNSAxOTVMMTA1IDEzNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo='
        };
        
        const productData = {
            name: 'Frontend Test Product',
            description: 'This is a test product to debug frontend image display',
            price: 25.99,
            category: 'T-Shirts',
            stock_quantity: 100,
            colors: ['Black', 'White'],
            sizes: ['S', 'M', 'L'],
            images: [testImage],
            specifications: {
                material: '100% Cotton',
                weight: '180g',
                fit: 'Regular Fit'
            },
            features: {
                preshrunk: true,
                double_stitched: true,
                fade_resistant: true
            },
            tags: ['test', 'frontend', 'debug']
        };
        
        const response = await axios.post('http://localhost:3000/api/admin/products', productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Test product created successfully!');
        console.log('Product ID:', response.data.product.id);
        console.log('Product Name:', response.data.product.name);
        console.log('Image URL:', response.data.product.image_url);
        
        return response.data.product.id;
        
    } catch (error) {
        console.error('❌ Error creating test product:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

createTestProduct(); 