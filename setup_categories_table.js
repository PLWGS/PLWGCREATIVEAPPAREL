const { Client } = require('pg');

async function setupCategoriesTable() {
    const client = new Client({
        connectionString: 'postgresql://postgres:VUnnjQcJRFyEWKlrJbCiWsshrEpYkUbp@trolley.proxy.rlwy.net:19611/railway'
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Create categories table if it doesn't exist
        console.log('\n🔍 Checking if categories table exists...');
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'categories'
            );
        `);

        if (!tableExists.rows[0].exists) {
            console.log('➕ Creating categories table...');
            await client.query(`
                CREATE TABLE categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    display_order INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('✅ Categories table created successfully!');
        } else {
            console.log('ℹ️ Categories table already exists');
        }

        // Create index for performance
        console.log('\n📊 Creating performance indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_categories_name 
            ON categories (name);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_categories_display_order 
            ON categories (display_order);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_products_category 
            ON products (category);
        `);
        
        console.log('✅ Indexes created successfully!');

        // Insert default categories if table is empty
        console.log('\n🏷️ Checking for existing categories...');
        const categoryCount = await client.query('SELECT COUNT(*) FROM categories');
        
        if (parseInt(categoryCount.rows[0].count) === 0) {
            console.log('➕ Inserting default categories...');
            
            const defaultCategories = [
                { name: 'Adult Shirts', description: 'General adult apparel and shirts', order: 1 },
                { name: 'Adult Hoodies', description: 'Adult hoodies and sweatshirts', order: 2 },
                { name: 'Adult Birthday', description: 'Birthday themed adult clothing', order: 3 },
                { name: 'Youth Shirts', description: 'Children and youth shirts', order: 4 },
                { name: 'Youth Hoodies', description: 'Children and youth hoodies', order: 5 },
                { name: 'Youth Birthday', description: 'Birthday themed youth clothing', order: 6 },
                { name: 'Family/Team Shirts', description: 'Family and team group shirts', order: 7 },
                { name: 'Mother\'s Day', description: 'Mother\'s Day themed clothing', order: 8 },
                { name: 'Father\'s Day', description: 'Father\'s Day themed clothing', order: 9 },
                { name: 'Halloween', description: 'Halloween and spooky themed clothing', order: 10 },
                { name: 'Christmas', description: 'Christmas and holiday themed clothing', order: 11 },
                { name: 'Other Holidays', description: 'Other holiday themed clothing', order: 12 },
                { name: 'Uncategorized', description: 'Products without specific category', order: 999 }
            ];

            for (const category of defaultCategories) {
                await client.query(`
                    INSERT INTO categories (name, description, display_order, created_at, updated_at)
                    VALUES ($1, $2, $3, NOW(), NOW())
                    ON CONFLICT (name) DO NOTHING
                `, [category.name, category.description, category.order]);
            }
            
            console.log(`✅ Inserted ${defaultCategories.length} default categories`);
        } else {
            console.log(`ℹ️ Found ${categoryCount.rows[0].count} existing categories`);
        }

        // Show current categories
        console.log('\n📋 Current categories:');
        const categories = await client.query(`
            SELECT name, description, display_order, created_at
            FROM categories
            ORDER BY display_order ASC, name ASC
        `);

        categories.rows.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat.name} (Order: ${cat.display_order})`);
            if (cat.description) {
                console.log(`     Description: ${cat.description}`);
            }
        });

        // Show category distribution
        console.log('\n📊 Category distribution in products:');
        const productDistribution = await client.query(`
            SELECT 
                COALESCE(p.category, 'Uncategorized') as category,
                COUNT(*) as product_count
            FROM products p
            GROUP BY p.category
            ORDER BY product_count DESC
        `);

        productDistribution.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.product_count} products`);
        });

        console.log('\n🎉 Categories table setup completed successfully!');
        console.log('\n📱 Next Steps:');
        console.log('  1. Access the Category Management page from your admin dashboard');
        console.log('  2. Add, edit, or delete categories as needed');
        console.log('  3. All changes will automatically sync with your shop page');
        console.log('  4. Categories are now managed through the admin interface');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

setupCategoriesTable();
