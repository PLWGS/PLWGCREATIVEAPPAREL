const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateProduct() {
  try {
    console.log('🔄 Updating product with sizes and tags...');
    
    const result = await pool.query(`
      UPDATE products 
      SET 
        sizes = $1,
        tags = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *
    `, [
      JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      ['Horror', 'Gothic', 'StreetArt', 'Vintage']
    ]);
    
    if (result.rows.length > 0) {
      console.log('✅ Product updated successfully!');
      console.log('📊 Updated product:', result.rows[0]);
    } else {
      console.log('❌ Product not found');
    }
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
  } finally {
    await pool.end();
  }
}

updateProduct();
