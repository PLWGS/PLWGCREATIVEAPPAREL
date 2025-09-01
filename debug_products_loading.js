// Quick debug script to test product loading
(async function() {
    console.log('🔍 Starting product loading debug...');
    
    // Check admin token
    const token = localStorage.getItem('adminToken');
    console.log('Admin token exists:', !!token);
    if (token) {
        console.log('Token length:', token.length);
    }
    
    try {
        // Test API call
        console.log('Making API request...');
        const response = await fetch('/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const products = await response.json();
            console.log('Products loaded:', products.length);
            console.log('First 3 products:', products.slice(0, 3));
        } else {
            const error = await response.text();
            console.error('API Error:', error);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
})();
