const { Pool } = require('pg');
require('dotenv').config();

async function fixUncategoryCategory() {
  console.log('🔧 Fixing deleted "Uncategory" fallback category...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Step 1: Check if "Uncategory" already exists
    const existingCheck = await pool.query(
      'SELECT id, name FROM categories WHERE name ILIKE $1',
      ['%uncategory%']
    );

    if (existingCheck.rows.length > 0) {
      console.log('✅ "Uncategory" category already exists:', existingCheck.rows[0]);
      return existingCheck.rows[0].id;
    }

    // Step 2: Create the "Uncategory" fallback category
    const insertResult = await pool.query(`
      INSERT INTO categories (name, description, display_order, created_at, updated_at) 
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, name
    `, [
      'Uncategory',
      'Default category for uncategorized products - DO NOT DELETE - System Critical',
      999
    ]);

    const newCategory = insertResult.rows[0];
    console.log('✅ Created "Uncategory" category:', newCategory);

    // Step 3: Check for orphaned products
    const orphanedProducts = await pool.query(`
      SELECT p.id, p.name, p.category
      FROM products p 
      WHERE p.category IS NULL 
         OR p.category NOT IN (SELECT name FROM categories)
    `);

    if (orphanedProducts.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedProducts.rows.length} orphaned products:`);
      orphanedProducts.rows.forEach(product => {
        console.log(`   - ${product.name} (Category: ${product.category || 'NULL'})`);
      });

      // Step 4: Reassign orphaned products to "Uncategory"
      const updateResult = await pool.query(`
        UPDATE products 
        SET category = $1, updated_at = NOW()
        WHERE category IS NULL 
           OR category NOT IN (SELECT name FROM categories)
      `, [newCategory.name]);

      console.log(`✅ Reassigned ${updateResult.rowCount} orphaned products to "Uncategory"`);
    } else {
      console.log('✅ No orphaned products found');
    }

    // Step 5: Verify the fix
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as orphaned_count
      FROM products p 
      WHERE p.category IS NULL 
         OR p.category NOT IN (SELECT name FROM categories)
    `);

    console.log(`🔍 Final verification: ${finalCheck.rows[0].orphaned_count} orphaned products remaining`);

    // Step 6: Show products now in "Uncategory"
    const uncategoryProducts = await pool.query(`
      SELECT p.id, p.name
      FROM products p
      WHERE p.category ILIKE '%uncategory%'
      ORDER BY p.name
    `);

    if (uncategoryProducts.rows.length > 0) {
      console.log(`📦 Products now in "Uncategory" (${uncategoryProducts.rows.length}):`);
      uncategoryProducts.rows.forEach(product => {
        console.log(`   - ${product.name}`);
      });
    } else {
      console.log('📦 No products currently in "Uncategory"');
    }

    return newCategory.id;

  } catch (error) {
    console.error('❌ Error fixing "Uncategory" category:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
fixUncategoryCategory()
  .then(categoryId => {
    console.log(`\n🎉 "Uncategory" category fix completed! Category ID: ${categoryId}`);
    console.log('💡 This category is now protected and should not be deleted again.');
  })
  .catch(error => {
    console.error('💥 Failed to fix "Uncategory" category:', error);
    process.exit(1);
  });
