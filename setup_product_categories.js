const { Client } = require('pg');

async function setupProductCategories() {
    const client = new Client({
        connectionString: 'postgresql://postgres:VUnnjQcJRFyEWKlrJbCiWsshrEpYkUbp@trolley.proxy.rlwy.net:19611/railway'
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Check if category column exists
        console.log('\n🔍 Checking current table structure...');
        const tableInfo = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'category'
        `);

        if (tableInfo.rows.length === 0) {
            console.log('➕ Adding category column...');
            await client.query(`
                ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'Adult Shirts'
            `);
            console.log('✅ category column added successfully!');
        } else {
            console.log('ℹ️ category column already exists');
        }

        // Update products with appropriate categories based on their names/content
        console.log('\n🏷️ Updating products with categories...');
        
        // Adult Shirts (general adult apparel)
        await client.query(`
            UPDATE products 
            SET category = 'Adult Shirts'
            WHERE category IS NULL OR category = ''
        `);

        // Update specific products based on their names/content
        const categoryUpdates = [
            // Adult Hoodies
            { pattern: 'hoodie', category: 'Adult Hoodies' },
            { pattern: 'sweatshirt', category: 'Adult Hoodies' },
            
            // Adult Birthday
            { pattern: 'birthday', category: 'Adult Birthday' },
            { pattern: 'party', category: 'Adult Birthday' },
            
            // Youth Shirts
            { pattern: 'youth', category: 'Youth Shirts' },
            { pattern: 'kids', category: 'Youth Shirts' },
            { pattern: 'child', category: 'Youth Shirts' },
            
            // Youth Hoodies
            { pattern: 'youth hoodie', category: 'Youth Hoodies' },
            { pattern: 'kids hoodie', category: 'Youth Hoodies' },
            
            // Youth Birthday
            { pattern: 'youth birthday', category: 'Youth Birthday' },
            { pattern: 'kids birthday', category: 'Youth Birthday' },
            
            // Family/Team Shirts
            { pattern: 'family', category: 'Family/Team Shirts' },
            { pattern: 'team', category: 'Family/Team Shirts' },
            { pattern: 'group', category: 'Family/Team Shirts' },
            
            // Mother's Day
            { pattern: 'mother', category: 'Mother\'s Day' },
            { pattern: 'mom', category: 'Mother\'s Day' },
            { pattern: 'mama', category: 'Mother\'s Day' },
            
            // Father's Day
            { pattern: 'father', category: 'Father\'s Day' },
            { pattern: 'dad', category: 'Father\'s Day' },
            { pattern: 'daddy', category: 'Father\'s Day' },
            
            // Halloween
            { pattern: 'halloween', category: 'Halloween' },
            { pattern: 'spooky', category: 'Halloween' },
            { pattern: 'scary', category: 'Halloween' },
            { pattern: 'ghost', category: 'Halloween' },
            { pattern: 'vampire', category: 'Halloween' },
            { pattern: 'witch', category: 'Halloween' },
            
            // Christmas
            { pattern: 'christmas', category: 'Christmas' },
            { pattern: 'holiday', category: 'Christmas' },
            { pattern: 'santa', category: 'Christmas' },
            { pattern: 'elf', category: 'Christmas' },
            { pattern: 'reindeer', category: 'Christmas' },
            
            // Other Holidays
            { pattern: 'easter', category: 'Other Holidays' },
            { pattern: 'valentine', category: 'Other Holidays' },
            { pattern: 'thanksgiving', category: 'Other Holidays' },
            { pattern: 'st patrick', category: 'Other Holidays' },
            { pattern: '4th of july', category: 'Other Holidays' }
        ];

        for (const update of categoryUpdates) {
            const result = await client.query(`
                UPDATE products 
                SET category = $1
                WHERE LOWER(name) LIKE $2 OR LOWER(description) LIKE $2
            `, [update.category, `%${update.pattern}%`]);
            
            if (result.rowCount > 0) {
                console.log(`✅ Updated ${result.rowCount} products to category: ${update.category}`);
            }
        }

        // Create index for performance
        console.log('\n📊 Creating performance index...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_category
            ON products (category)
        `);
        console.log('✅ Category index created successfully!');

        // Show category distribution
        console.log('\n📋 Category Distribution:');
        const categoryCounts = await client.query(`
            SELECT category, COUNT(*) as count
            FROM products
            GROUP BY category
            ORDER BY count DESC
        `);

        categoryCounts.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count} products`);
        });

        // Show sample products from each category
        console.log('\n🔍 Sample Products by Category:');
        for (const row of categoryCounts.rows) {
            if (row.count > 0) {
                const sampleProducts = await client.query(`
                    SELECT name, category
                    FROM products
                    WHERE category = $1
                    LIMIT 2
                `, [row.category]);
                
                console.log(`\n${row.category} (${row.count} products):`);
                sampleProducts.rows.forEach(product => {
                    console.log(`  - ${product.name}`);
                });
            }
        }

        console.log('\n🎉 Product categorization setup completed successfully!');
        console.log('\n📊 Next Steps:');
        console.log('  1. The frontend will now show correct category counts');
        console.log('  2. Users can filter products by category');
        console.log('  3. Category filtering will work properly');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

setupProductCategories();
