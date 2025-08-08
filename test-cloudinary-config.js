const cloudinary = require('cloudinary').v2;
require('dotenv').config();

console.log('🧪 Testing Cloudinary configuration...');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  console.log('\n🔧 Using CLOUDINARY_URL configuration');
  cloudinary.config({
    url: process.env.CLOUDINARY_URL
  });
} else {
  console.log('\n🔧 Using individual credentials configuration');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Test Cloudinary connection
async function testCloudinaryConnection() {
  try {
    console.log('\n🔗 Testing Cloudinary connection...');
    
    // Try to get account info to test connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('📊 Account info:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
}

// Test image upload
async function testImageUpload() {
  try {
    console.log('\n📸 Testing image upload...');
    
    // Create a simple test image (base64 SVG)
    const testImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVzdDwvdGV4dD4KPC9zdmc+';
    
    const result = await cloudinary.uploader.upload(testImage, {
      public_id: 'test-upload',
      folder: 'plwg-creative-apparel/test',
      transformation: [
        { width: 300, height: 300, crop: 'fill' }
      ]
    });
    
    console.log('✅ Test image upload successful!');
    console.log('📊 Upload result:', result.secure_url);
    
    // Clean up test image
    await cloudinary.uploader.destroy('plwg-creative-apparel/test/test-upload');
    console.log('🧹 Test image cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Test image upload failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n🚀 Starting Cloudinary tests...\n');
  
  const connectionTest = await testCloudinaryConnection();
  const uploadTest = await testImageUpload();
  
  console.log('\n📋 Test Results:');
  console.log('Connection Test:', connectionTest ? '✅ PASS' : '❌ FAIL');
  console.log('Upload Test:', uploadTest ? '✅ PASS' : '❌ FAIL');
  
  if (connectionTest && uploadTest) {
    console.log('\n🎉 All tests passed! Cloudinary is properly configured.');
    console.log('💡 The image upload issue might be in the frontend or data processing.');
  } else {
    console.log('\n❌ Some tests failed. Please check your Cloudinary configuration.');
    console.log('💡 Make sure your .env file has the correct Cloudinary credentials.');
  }
}

runTests(); 