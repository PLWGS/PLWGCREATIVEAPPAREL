const { uploadProductImages } = require('./cloudinary-upload.js');

// Simulate the exact data structure that the frontend sends
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

console.log('🧪 Testing image upload with frontend data structure...');
console.log('📊 Test images structure:', JSON.stringify(testImages, null, 2));

async function testUpload() {
  try {
    console.log('\n📸 Starting upload test...');
    const result = await uploadProductImages(testImages, 'Test Product');
    console.log('\n✅ Upload test completed!');
    console.log('📊 Result:', result);
  } catch (error) {
    console.error('\n❌ Upload test failed:', error);
  }
}

testUpload(); 