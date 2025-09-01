const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkData() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check products
    const products = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('📦 Products count:', products.rows[0].count);
    
    // Show first few products
    const sampleProducts = await pool.query('SELECT id, name, price FROM products LIMIT 5');
    console.log('📦 Sample products:', sampleProducts.rows);
    
    // Check orders  
    const orders = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('📋 Orders count:', orders.rows[0].count);
    
    // Check subscribers
    const subscribers = await pool.query('SELECT COUNT(*) as count FROM subscribers');
    console.log('👥 Subscribers count:', subscribers.rows[0].count);
    
    // List all tables
    const tables = await pool.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
    console.log('📊 Available tables:', tables.rows.map(r => r.tablename));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
