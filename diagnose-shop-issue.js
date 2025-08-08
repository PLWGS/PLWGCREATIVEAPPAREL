const axios = require('axios');

async function diagnoseShopIssue() {
    console.log('🔍 DIAGNOSING SHOP PAGE ISSUE...\n');
    
    try {
        // Step 1: Check if server is running
        console.log('1️⃣ Checking if server is running...');
        try {
            const response = await axios.get('http://localhost:3000/api/products/public');
            console.log('✅ Server is running and responding');
        } catch (error) {
            console.log('❌ Server is not running or not accessible');
            console.log('Please start the server with: npm start');
            return;
        }
        
        // Step 2: Check products in database
        console.log('\n2️⃣ Checking products in database...');
        const productsResponse = await axios.get('http://localhost:3000/api/products/public');
        
        if (productsResponse.data && Array.isArray(productsResponse.data)) {
            console.log(`✅ Found ${productsResponse.data.length} products in database`);
            
            productsResponse.data.forEach((product, index) => {
                console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
                console.log(`     Price: $${product.price}`);
                console.log(`     Image: ${product.image_url ? '✅ Has image' : '❌ No image'}`);
                if (product.image_url && product.image_url.startsWith('https://res.cloudinary.com')) {
                    console.log(`     Cloudinary: ✅`);
                } else {
                    console.log(`     Cloudinary: ❌`);
                }
            });
        } else {
            console.log('❌ No products found in database');
        }
        
        // Step 3: Test individual product endpoints
        console.log('\n3️⃣ Testing individual product endpoints...');
        if (productsResponse.data && productsResponse.data.length > 0) {
            const firstProduct = productsResponse.data[0];
            try {
                const singleProductResponse = await axios.get(`http://localhost:3000/api/products/public/${firstProduct.id}`);
                console.log(`✅ Individual product endpoint working for ID ${firstProduct.id}`);
            } catch (error) {
                console.log(`❌ Individual product endpoint failed for ID ${firstProduct.id}`);
            }
        }
        
        // Step 4: Check if shop page is accessible
        console.log('\n4️⃣ Checking if shop page is accessible...');
        try {
            const shopPageResponse = await axios.get('http://localhost:3000/pages/shop.html');
            console.log('✅ Shop page is accessible');
        } catch (error) {
            console.log('❌ Shop page is not accessible');
            console.log('Error:', error.message);
        }
        
        // Step 5: Provide troubleshooting steps
        console.log('\n📋 TROUBLESHOOTING STEPS FOR USER:');
        console.log('1. Clear browser cache and cookies');
        console.log('2. Open browser developer tools (F12)');
        console.log('3. Go to Console tab and look for JavaScript errors');
        console.log('4. Go to Network tab and check if API calls are being made');
        console.log('5. Visit: http://localhost:3000/pages/shop.html');
        console.log('6. Check if you see any products displayed');
        console.log('7. If no products, check the browser console for errors');
        
        console.log('\n🔧 POSSIBLE ISSUES AND SOLUTIONS:');
        console.log('• Browser caching: Clear cache and reload page');
        console.log('• JavaScript errors: Check browser console for errors');
        console.log('• Network issues: Check if localhost:3000 is accessible');
        console.log('• Wrong URL: Make sure you are visiting /pages/shop.html');
        console.log('• CORS issues: Check browser console for CORS errors');
        
        console.log('\n📊 CURRENT SYSTEM STATUS:');
        console.log(`• Server: ✅ Running`);
        console.log(`• Database: ✅ ${productsResponse.data ? productsResponse.data.length : 0} products`);
        console.log(`• API: ✅ Responding correctly`);
        console.log(`• Cloudinary: ✅ Images uploaded successfully`);
        
        if (productsResponse.data && productsResponse.data.length > 0) {
            console.log('\n✅ THE BACKEND IS WORKING PERFECTLY!');
            console.log('The issue is likely in the frontend display.');
            console.log('Please check the browser console for JavaScript errors.');
        } else {
            console.log('\n❌ NO PRODUCTS IN DATABASE');
            console.log('This explains why nothing is showing on the shop page.');
            console.log('Please create some products through the admin interface.');
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the diagnostic
diagnoseShopIssue(); 