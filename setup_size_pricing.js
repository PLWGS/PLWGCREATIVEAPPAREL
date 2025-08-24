const { Client } = require('pg');

async function setupSizePricing() {
    const client = new Client({
        connectionString: 'postgresql://postgres:VUnnjQcJRFyEWKlrJbCiWsshrEpYkUbp@trolley.proxy.rlwy.net:19611/railway'
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Check if size_pricing column exists
        console.log('\n🔍 Checking current table structure...');
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'size_pricing'
        `);
        
        if (tableInfo.rows.length === 0) {
            console.log('➕ Adding size_pricing column...');
            await client.query(`
                ALTER TABLE products ADD COLUMN size_pricing JSONB DEFAULT '{}'
            `);
            console.log('✅ size_pricing column added successfully!');
        } else {
            console.log('ℹ️ size_pricing column already exists');
        }

        // Update products with size pricing
        console.log('\n💰 Updating products with size-based pricing...');
        const updateResult = await client.query(`
            UPDATE products 
            SET size_pricing = $1::jsonb
            WHERE size_pricing = '{}' OR size_pricing IS NULL
        `, [JSON.stringify({
            "S": {"price": 20.00, "available": true},
            "M": {"price": 20.00, "available": true},
            "L": {"price": 20.00, "available": true},
            "XL": {"price": 20.00, "available": true},
            "2X": {"price": 22.00, "available": true}
        })]);
        
        console.log(`✅ Updated ${updateResult.rowCount} products with size pricing`);

        // Create index for performance
        console.log('\n📊 Creating performance index...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_size_pricing 
            ON products USING GIN (size_pricing)
        `);
        console.log('✅ Index created successfully!');

        // Show sample results
        console.log('\n📋 Sample results:');
        const sampleResults = await client.query(`
            SELECT id, name, price, size_pricing 
            FROM products 
            WHERE size_pricing IS NOT NULL 
            LIMIT 3
        `);
        
        sampleResults.rows.forEach((row, index) => {
            console.log(`\nProduct ${index + 1}:`);
            console.log(`  ID: ${row.id}`);
            console.log(`  Name: ${row.name}`);
            console.log(`  Base Price: $${row.price}`);
            console.log(`  2X Price: $${JSON.parse(row.size_pricing)['2X']?.price || 'N/A'}`);
        });

        console.log('\n🎉 Size-based pricing setup completed successfully!');
        console.log('\n📊 Pricing Structure:');
        console.log('  S, M, L, XL: $20.00');
        console.log('  2X: $22.00 (+$2.00)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

setupSizePricing();
