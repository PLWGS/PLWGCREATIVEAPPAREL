const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkProducts() {
  try {
    const result = await pool.query('SELECT id, name FROM products ORDER BY id');
    console.log('Products in database:');
    result.rows.forEach(row => {
      console.log(`ID ${row.id}: ${row.name}`);
    });
    console.log(`Total products: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkProducts(); 