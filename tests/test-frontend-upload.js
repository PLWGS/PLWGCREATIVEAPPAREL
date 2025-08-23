const axios = require('axios');

// Simulate the exact frontend upload process
async function testFrontendUpload() {
  try {
    console.log('🧪 Testing frontend upload simulation...');
    
    // First, get admin token
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      email: 'admin@plwgscreativeapparel.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Create test images (simulating frontend FileReader behavior)
    const testImages = [
      {
        name: 'test-image-1.jpg',
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVzdDwvdGV4dD4KPC9zdmc+'
      },
      {
        name: 'test-image-2.jpg',
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmZmIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVzdCAyPC90ZXh0Pgo8L3N2Zz4='
      }
    ];
    
    // Simulate the exact product data structure sent by frontend
    const productData = {
      name: 'Test Product with Images',
      description: 'This is a test product with images',
      price: 25.00,
      original_price: 30.00,
      category: 'Test',
      stock_quantity: 50,
      low_stock_threshold: 5,
      sale_percentage: 15,
      tags: ['test', 'debug'],
      colors: ['Black', 'White'],
      sizes: ['S', 'M', 'L'],
      images: testImages, // This is the key part - the images array
      specifications: {
        material: '100% Cotton',
        weight: '180 GSM',
        fit: 'Regular',
        neck_style: 'Crew Neck',
        sleeve_length: 'Short Sleeve',
        origin: 'Made in USA'
      },
      features: {
        preshrunk: true,
        double_stitched: true,
        fade_resistant: true,
        soft_touch: true
      }
    };
    
    console.log('📤 Sending product data to server...');
    console.log('🔍 Images being sent:', JSON.stringify(testImages, null, 2));
    
    // Send to server
    const response = await axios.post('http://localhost:3000/api/admin/products', productData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Product created successfully!');
    console.log('📊 Response:', response.data);
    
    // Check if the product was created with images
    const productId = response.data.product.id;
    console.log(`🔍 Checking product ${productId} for images...`);
    
    const productResponse = await axios.get(`http://localhost:3000/api/products/public/${productId}`);
    const product = productResponse.data;
    
    console.log('📊 Product details:');
    console.log('Name:', product.name);
    console.log('Image URL:', product.image_url);
    console.log('Sub images:', product.sub_images);
    
    if (product.image_url && !product.image_url.includes('data:image/svg+xml')) {
      console.log('✅ Product has real Cloudinary image!');
    } else {
      console.log('❌ Product still has placeholder image');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendUpload(); 