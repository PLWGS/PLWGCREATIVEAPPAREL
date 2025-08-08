const axios = require('axios');

async function updateProductWithImages() {
  try {
    console.log('🔄 Updating existing product with real images...');
    
    // First, get admin token
    const loginResponse = await axios.post('http://localhost:3000/api/admin/login', {
      email: 'admin@plwgscreativeapparel.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Create test images for the existing product
    const testImages = [
      {
        name: 'product-image-1.jpg',
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SlVTVCBBIExJVFRMRSBCT09TVDwvdGV4dD4KPC9zdmc+'
      },
      {
        name: 'product-image-2.jpg',
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmZmIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SEFMTE9XRUVOPC90ZXh0Pgo8L3N2Zz4='
      }
    ];
    
    // Update the existing product (ID 1)
    const updateData = {
      name: 'JUST A LITTLE BOOST 2',
      description: 'HALLOWEEN',
      price: 22.00,
      original_price: 28.00,
      category: 'Halloween',
      stock_quantity: 50,
      low_stock_threshold: 5,
      sale_percentage: 15,
      tags: ['halloween', 'boost'],
      colors: ['Black', 'White', 'Gray', 'Navy'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      images: testImages, // This will trigger Cloudinary upload
      specifications: {
        material: '100% Premium Cotton',
        weight: '180 GSM',
        fit: 'Unisex Regular',
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
    
    console.log('📤 Updating product with images...');
    
    const response = await axios.put('http://localhost:3000/api/admin/products/1', updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Product updated successfully!');
    console.log('📊 Response:', response.data);
    
    // Check the updated product
    const productResponse = await axios.get('http://localhost:3000/api/products/public/1');
    const product = productResponse.data;
    
    console.log('\n📊 Updated product details:');
    console.log('Name:', product.name);
    console.log('Image URL:', product.image_url);
    console.log('Sub images:', product.sub_images);
    
    if (product.image_url && !product.image_url.includes('data:image/svg+xml')) {
      console.log('✅ Product now has real Cloudinary images!');
    } else {
      console.log('❌ Product still has placeholder images');
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error.response?.data || error.message);
  }
}

updateProductWithImages(); 