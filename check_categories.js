const { Client } = require('pg');

async function checkCategories() {
    const client = new Client({
        connectionString: 'postgresql://postgres:VUnnjQcJRFyEWKlrJbCiWsshrEpYkUbp@trolley.proxy.rlwy.net:19611/railway'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Get top categories by product count
        const categoriesResult = await client.query(`
            SELECT DISTINCT category, COUNT(*) as product_count 
            FROM products 
            WHERE category IS NOT NULL AND category != '' 
            GROUP BY category 
            ORDER BY product_count DESC 
            LIMIT 10
        `);
        
        console.log('\n📊 Top Categories:');
        categoriesResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.category} (${row.product_count} products)`);
        });
        
        // Get featured products
        const featuredResult = await client.query(`
            SELECT id, name, price, image_url, category
            FROM products 
            WHERE is_featured = true 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        
        console.log('\n⭐ Featured Products:');
        featuredResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name} - $${row.price} (${row.category})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkCategories();
