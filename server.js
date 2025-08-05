const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://plwgscreativeapparel.com',
  credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Database connection
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('⚠️ No DATABASE_URL found - running in development mode without database');
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Helper function to check database availability
function checkDatabase() {
  if (!pool) {
    return { available: false, error: 'Database not configured' };
  }
  return { available: true };
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Initialize database tables
async function initializeDatabase() {
  if (!pool) {
    console.log('⚠️ Skipping database initialization - no database connection');
    return;
  }
  
  try {
    // Create subscribers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        welcome_email_sent BOOLEAN DEFAULT false,
        discount_code_used BOOLEAN DEFAULT false
      )
    `);

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        birthday DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        loyalty_points INTEGER DEFAULT 0,
        loyalty_tier VARCHAR(50) DEFAULT 'Creative Rebel',
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0.00,
        average_order_value DECIMAL(10,2) DEFAULT 0.00,
        favorite_day_to_shop VARCHAR(20),
        style_consistency VARCHAR(20) DEFAULT 'High',
        most_active_season VARCHAR(20)
      )
    `);

    // Create customer_addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        address_type VARCHAR(50) DEFAULT 'DEFAULT',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'United States',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customer_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_preferences (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        preference_type VARCHAR(50) NOT NULL,
        preference_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, preference_type)
      )
    `);

    // Create customer_style_profile table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_style_profile (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        horror_aesthetic_percentage INTEGER DEFAULT 0,
        pop_culture_percentage INTEGER DEFAULT 0,
        humor_sass_percentage INTEGER DEFAULT 0,
        favorite_colors TEXT[],
        preferred_sizes JSONB,
        fit_preference VARCHAR(50) DEFAULT 'Regular Fit',
        length_preference VARCHAR(50) DEFAULT 'Standard',
        satisfaction_rate INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, product_id)
      )
    `);

    // Create loyalty_rewards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loyalty_rewards (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        reward_type VARCHAR(100) NOT NULL,
        reward_name VARCHAR(255) NOT NULL,
        points_cost INTEGER NOT NULL,
        is_redeemed BOOLEAN DEFAULT false,
        redeemed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create loyalty_points_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points_history (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        points_change INTEGER NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        description TEXT,
        order_id INTEGER REFERENCES orders(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        image_url VARCHAR(500),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        tags TEXT[],
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        is_on_sale BOOLEAN DEFAULT false,
        sale_percentage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        total_amount DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        shipping_amount DECIMAL(10,2) DEFAULT 0.00,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        discount_code VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        billing_address TEXT,
        tracking_number VARCHAR(100),
        notes TEXT,
        loyalty_points_earned INTEGER DEFAULT 0,
        loyalty_points_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        size VARCHAR(10),
        color VARCHAR(50),
        custom_design_details TEXT
      )
    `);

    // Create custom_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_requests (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        request_type VARCHAR(100),
        description TEXT,
        quantity INTEGER,
        estimated_budget DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample products if table is empty
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price, original_price, image_url, category, subcategory, tags, stock_quantity, is_featured, is_on_sale, sale_percentage) VALUES
        ('Horror Skull Tee', 'Classic horror skull design on premium cotton', 24.99, 29.99, '../etsy_images/product_01_Horror-Skull-Tee.jpg', 'Horror', 'Essentials', ARRAY['horror', 'skull', 'dark'], 50, true, true, 17),
        ('Pop Culture Mashup', 'Unique pop culture combination design', 26.99, 32.99, '../etsy_images/product_02_Pop-Culture-Mashup.jpg', 'Pop Culture', 'Featured', ARRAY['pop culture', 'mashup', 'retro'], 35, true, true, 18),
        ('Sarcastic Quote Tee', 'Witty and sarcastic quote design', 24.99, 29.99, '../etsy_images/product_03_Sarcastic-Quote-Tee.jpg', 'Humor & Sass', 'Quotes', ARRAY['sarcastic', 'humor', 'quotes'], 40, false, true, 17),
        ('Minimalist Rebel', 'Clean minimalist rebel design', 22.99, 27.99, '../etsy_images/product_04_Minimalist-Rebel.jpg', 'Custom Designs', 'Minimalist', ARRAY['minimalist', 'rebel', 'clean'], 30, false, true, 18),
        ('Halloween One Two He''s Coming for You Shirt', 'Spooky Halloween design', 27.99, 34.99, '../etsy_images/product_07_Kids-Halloween-Horror-Friends-Hoodie-Printed-Desig.jpg', 'Horror', 'Halloween', ARRAY['halloween', 'spooky', 'horror'], 25, true, true, 20),
        ('Gothic Dreams Tee', 'Dark aesthetic meets comfort in this premium design', 23.99, 29.99, '../etsy_images/product_05_Be-Kind-T-Shirt.jpg', 'Horror', 'Gothic', ARRAY['gothic', 'dark', 'aesthetic'], 45, true, true, 20),
        ('Neon Nights Tee', 'Cyberpunk vibes with retro aesthetics', 32.99, 39.99, '../etsy_images/product_06_Custom-Bridezilla-Shirt-Printed-Design-Bridezilla-.jpg', 'Pop Culture', 'Cyberpunk', ARRAY['cyberpunk', 'neon', 'retro'], 20, true, false, 0),
        ('Cosmic Cat Tee', 'Feline meets space in this whimsical design', 28.99, 34.99, '../etsy_images/product_08_Best-Dad-Ever-T-Shirt-Printed-Design-Best-Dad-Shir.jpg', 'Custom Designs', 'Whimsical', ARRAY['cosmic', 'cat', 'space'], 30, false, true, 17)
      `);
    }

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 DEBUG LOGIN ATTEMPT:');
    console.log('Email provided:', email);
    console.log('Password provided:', password ? '[HIDDEN]' : 'undefined');
    console.log('ADMIN_EMAIL from env:', process.env.ADMIN_EMAIL);
    console.log('ADMIN_PASSWORD_HASH from env:', process.env.ADMIN_PASSWORD_HASH ? '[EXISTS]' : 'undefined');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if admin credentials match
    if (email === process.env.ADMIN_EMAIL) {
      console.log('✅ Email matches');
      const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
      console.log('🔐 Password check result:', isValidPassword);
      
      if (isValidPassword) {
        const token = jwt.sign(
          { email, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
          success: true,
          token,
          user: { email, role: 'admin' }
        });
      } else {
        console.log('❌ Password does not match hash');
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      console.log('❌ Email does not match');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify admin token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// =============================================================================
// ORDER MANAGEMENT ENDPOINTS
// =============================================================================

// Get all orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    // Return mock data for development
    return res.json({ orders: [] });
  }

  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, 
             c.name as customer_name, 
             c.email as customer_email,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY o.id, c.name, c.email ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(`
      SELECT o.*, c.name as customer_name, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const itemsResult = await pool.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [id]);
    
    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;
    
    const result = await pool.query(`
      UPDATE orders 
      SET status = $1, tracking_number = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *
    `, [status, tracking_number, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_email, customer_name, items, total_amount, shipping_address } = req.body;
    
    // Generate order number
    const orderNumber = 'ORD-' + Date.now();
    
    // Create customer if doesn't exist
    let customerResult = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [customer_email]
    );
    
    let customerId = null;
    if (customerResult.rows.length === 0) {
      const newCustomer = await pool.query(
        'INSERT INTO customers (email, name) VALUES ($1, $2) RETURNING id',
        [customer_email, customer_name]
      );
      customerId = newCustomer.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
    }
    
    // Create order
    const orderResult = await pool.query(`
      INSERT INTO orders (order_number, customer_id, customer_email, customer_name, total_amount, shipping_address)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [orderNumber, customerId, customer_email, customer_name, total_amount, shipping_address]);
    
    const order = orderResult.rows[0];
    
    // Create order items
    for (const item of items) {
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, size, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [order.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price, item.size, item.color]);
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// PRODUCT MANAGEMENT ENDPOINTS
// =============================================================================

// Get all products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM products ORDER BY created_at DESC
    `);
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock_quantity } = req.body;
    
    const result = await pool.query(`
      INSERT INTO products (name, description, price, image_url, category, stock_quantity)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [name, description, price, image_url, category, stock_quantity]);
    
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, category, stock_quantity, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, price = $3, image_url = $4, category = $5, stock_quantity = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 RETURNING *
    `, [name, description, price, image_url, category, stock_quantity, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// CUSTOMER MANAGEMENT ENDPOINTS
// =============================================================================

// Get all customers
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             COUNT(o.id) as total_orders,
             SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const ordersResult = await pool.query(`
      SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      customer: customerResult.rows[0],
      orders: ordersResult.rows
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// CUSTOM REQUESTS ENDPOINTS
// =============================================================================

// Get all custom requests
app.get('/api/custom-requests', authenticateToken, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    let query = 'SELECT * FROM custom_requests';
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (priority) {
      conditions.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching custom requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update custom request status
app.patch('/api/custom-requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const result = await pool.query(`
      UPDATE custom_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error updating custom request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

// Get dashboard analytics
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    // Return mock data for development
    return res.json({
      sales: { total_sales: 0, total_orders: 0 },
      topProducts: [],
      dailySales: [],
      lowStock: []
    });
  }

  try {
    const { period = '7d' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case '1d':
        dateFilter = "WHERE created_at >= CURRENT_DATE";
        break;
      case '7d':
        dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'";
        break;
    }
    
    // Total sales
    const salesResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales,
             COUNT(*) as total_orders
      FROM orders ${dateFilter}
    `);
    
    // Top products
    const topProductsResult = await pool.query(`
      SELECT oi.product_name,
             SUM(oi.quantity) as total_sold,
             SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${dateFilter.replace('WHERE', 'WHERE o.')}
      GROUP BY oi.product_name
      ORDER BY total_revenue DESC
      LIMIT 5
    `);
    
    // Sales by day
    const dailySalesResult = await pool.query(`
      SELECT DATE(created_at) as date,
             SUM(total_amount) as daily_sales,
             COUNT(*) as daily_orders
      FROM orders ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    // Low stock products
    const lowStockResult = await pool.query(`
      SELECT name, stock_quantity, low_stock_threshold
      FROM products
      WHERE stock_quantity <= low_stock_threshold AND is_active = true
      ORDER BY stock_quantity ASC
    `);
    
    res.json({
      sales: salesResult.rows[0],
      topProducts: topProductsResult.rows,
      dailySales: dailySalesResult.rows,
      lowStock: lowStockResult.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// INVENTORY MANAGEMENT ENDPOINTS
// =============================================================================

// Get inventory status
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, stock_quantity, low_stock_threshold, 
             CASE 
               WHEN stock_quantity = 0 THEN 'out_of_stock'
               WHEN stock_quantity <= low_stock_threshold THEN 'low_stock'
               ELSE 'in_stock'
             END as status
      FROM products
      WHERE is_active = true
      ORDER BY stock_quantity ASC
    `);
    
    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product stock
app.patch('/api/products/:id/stock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    
    const result = await pool.query(`
      UPDATE products 
      SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [stock_quantity, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// EXISTING NEWSLETTER ENDPOINTS
// =============================================================================

// Newsletter subscription endpoint
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if subscriber already exists
    const existingSubscriber = await pool.query(
      'SELECT * FROM subscribers WHERE email = $1',
      [email]
    );

    if (existingSubscriber.rows.length > 0) {
      const subscriber = existingSubscriber.rows[0];
      if (subscriber.is_active) {
        return res.status(400).json({ error: 'Email already subscribed' });
      } else {
        // Reactivate subscription
        await pool.query(
          'UPDATE subscribers SET is_active = true, welcome_email_sent = false WHERE email = $1',
          [email]
        );
        await sendWelcomeEmail(email, name || subscriber.name);
        return res.json({ 
          success: true, 
          message: 'Successfully re-subscribed to newsletter!',
          subscriber: { ...subscriber, is_active: true }
        });
      }
    }

    // Insert new subscriber
    const newSubscriber = await pool.query(
      'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING *',
      [email, name || null]
    );

    // Send welcome email
    await sendWelcomeEmail(email, name);

    // Update welcome email sent status
    await pool.query(
      'UPDATE subscribers SET welcome_email_sent = true WHERE id = $1',
      [newSubscriber.rows[0].id]
    );

    res.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter!',
      subscriber: newSubscriber.rows[0]
    });

  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send welcome email function
async function sendWelcomeEmail(email, name) {
  const welcomeEmailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to PlwgsCreativeApparel!</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 40px 30px;
            }
            .welcome-text {
                font-size: 18px;
                color: #333;
                margin-bottom: 25px;
            }
            .highlight-box {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
                text-align: center;
            }
            .discount-code {
                font-size: 24px;
                font-weight: bold;
                background: white;
                color: #f5576c;
                padding: 10px 20px;
                border-radius: 5px;
                display: inline-block;
                margin: 10px 0;
            }
            .features {
                margin: 30px 0;
            }
            .feature {
                display: flex;
                align-items: center;
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .feature-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: white;
                font-weight: bold;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #666;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to PlwgsCreativeApparel!</h1>
                <p>Your journey to unique, custom apparel starts here</p>
            </div>
            
            <div class="content">
                <div class="welcome-text">
                    <p>Hi ${name || 'there'}!</p>
                    <p>Welcome to the PlwgsCreativeApparel family! We're thrilled to have you join our community of creative individuals who love to express themselves through unique, custom-designed apparel.</p>
                </div>

                <div class="highlight-box">
                    <h2>🎁 Your Welcome Gift</h2>
                    <p>As a special welcome, enjoy <strong>20% OFF</strong> your first order!</p>
                    <div class="discount-code">PROMOCODE20</div>
                    <p>Use this code at checkout for instant savings!</p>
                </div>

                <div class="features">
                    <h3>🌟 What Makes Us Special</h3>
                    
                    <div class="feature">
                        <div class="feature-icon">🎨</div>
                        <div>
                            <strong>Custom Designs</strong><br>
                            Create your own unique designs or let us bring your ideas to life
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">👕</div>
                        <div>
                            <strong>Quality Materials</strong><br>
                            Premium fabrics and printing techniques for lasting quality
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">🚚</div>
                        <div>
                            <strong>Fast Shipping</strong><br>
                            Quick turnaround times and reliable delivery
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">💝</div>
                        <div>
                            <strong>Personalized Service</strong><br>
                            Dedicated support for custom orders and special requests
                        </div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="https://plwgscreativeapparel.com/pages/shop.html" class="cta-button">
                        🛍️ Start Shopping Now
                    </a>
                </div>

                <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <h4>💡 Custom Design Requests</h4>
                    <p>Have a specific design in mind? We love creating custom pieces! Contact us for:</p>
                    <ul style="text-align: left;">
                        <li>Personalized family shirts</li>
                        <li>Event-specific designs</li>
                        <li>Corporate branding</li>
                        <li>Special occasion apparel</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p><strong>Stay Connected</strong></p>
                <div class="social-links">
                    <a href="#">Instagram</a> |
                    <a href="#">Facebook</a> |
                    <a href="#">Twitter</a>
                </div>
                <p>Questions? Contact us at <a href="mailto:support@plwgscreativeapparel.com">support@plwgscreativeapparel.com</a></p>
                <p style="font-size: 12px; margin-top: 20px;">
                    You're receiving this email because you subscribed to our newsletter.<br>
                    <a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '🎉 Welcome to PlwgsCreativeApparel - Your 20% OFF Code Inside!',
    html: welcomeEmailHTML
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${email}:`, error);
  }
}

// Get all subscribers (admin endpoint)
app.get('/api/subscribers', async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    // Return mock data for development
    return res.json({ subscribers: [] });
  }

  try {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY subscribed_at DESC');
    res.json({ subscribers: result.rows });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unsubscribe endpoint
app.post('/api/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query(
      'UPDATE subscribers SET is_active = false WHERE email = $1 RETURNING *',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// =============================================================================
// CUSTOMER DASHBOARD ENDPOINTS
// =============================================================================

// Customer authentication middleware
const authenticateCustomer = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' });
    }
    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Customer registration/login
app.post('/api/customer/auth', async (req, res) => {
  try {
    const { email, password, action = 'login', first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (action === 'register') {
      // Check if customer already exists
      const existingCustomer = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
      );

      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password and create customer
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newCustomer = await pool.query(`
        INSERT INTO customers (email, first_name, last_name, name)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [email, first_name, last_name, `${first_name} ${last_name}`]);

      const customer = newCustomer.rows[0];
      
      // Create default style profile
      await pool.query(`
        INSERT INTO customer_style_profile (customer_id)
        VALUES ($1)
      `, [customer.id]);

      const token = jwt.sign(
        { id: customer.id, email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          loyalty_points: customer.loyalty_points,
          loyalty_tier: customer.loyalty_tier
        }
      });
    } else {
      // Login
      const customer = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
      );

      if (customer.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For now, we'll use a simple password check
      // In production, you'd want to store hashed passwords
      if (password !== 'customer123') { // Temporary simple auth
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const customerData = customer.rows[0];
      const token = jwt.sign(
        { id: customerData.id, email, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        customer: {
          id: customerData.id,
          email: customerData.email,
          name: customerData.name,
          loyalty_points: customerData.loyalty_points,
          loyalty_tier: customerData.loyalty_tier
        }
      });
    }
  } catch (error) {
    console.error('Customer auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer profile
app.get('/api/customer/profile', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    
    const customerResult = await pool.query(`
      SELECT * FROM customers WHERE id = $1
    `, [customerId]);
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Get customer addresses
    const addressesResult = await pool.query(`
      SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC
    `, [customerId]);
    
    // Get customer preferences
    const preferencesResult = await pool.query(`
      SELECT * FROM customer_preferences WHERE customer_id = $1
    `, [customerId]);
    
    // Get style profile
    const styleProfileResult = await pool.query(`
      SELECT * FROM customer_style_profile WHERE customer_id = $1
    `, [customerId]);
    
    res.json({
      customer,
      addresses: addressesResult.rows,
      preferences: preferencesResult.rows,
      style_profile: styleProfileResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer profile
app.put('/api/customer/profile', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { first_name, last_name, phone, birthday, addresses, preferences } = req.body;
    
    // Update customer info
    await pool.query(`
      UPDATE customers 
      SET first_name = $1, last_name = $2, phone = $3, birthday = $4, name = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [first_name, last_name, phone, birthday, `${first_name} ${last_name}`, customerId]);
    
    // Update addresses if provided
    if (addresses && Array.isArray(addresses)) {
      // Clear existing addresses
      await pool.query('DELETE FROM customer_addresses WHERE customer_id = $1', [customerId]);
      
      // Insert new addresses
      for (const address of addresses) {
        await pool.query(`
          INSERT INTO customer_addresses (customer_id, address_type, first_name, last_name, address_line1, address_line2, city, state, postal_code, country, is_default)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [customerId, address.address_type, address.first_name, address.last_name, address.address_line1, address.address_line2, address.city, address.state, address.postal_code, address.country, address.is_default]);
      }
    }
    
    // Update preferences if provided
    if (preferences && Array.isArray(preferences)) {
      for (const pref of preferences) {
        await pool.query(`
          INSERT INTO customer_preferences (customer_id, preference_type, preference_value)
          VALUES ($1, $2, $3)
          ON CONFLICT (customer_id, preference_type) 
          DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP
        `, [customerId, pref.preference_type, pref.preference_value]);
      }
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer orders
app.get('/api/customer/orders', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { limit = 10, offset = 0 } = req.query;
    
    const ordersResult = await pool.query(`
      SELECT o.*, 
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [customerId, limit, offset]);
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(`
          SELECT * FROM order_items WHERE order_id = $1
        `, [order.id]);
        
        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );
    
    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer wishlist
app.get('/api/customer/wishlist', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    
    const wishlistResult = await pool.query(`
      SELECT w.*, p.*
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.customer_id = $1
      ORDER BY w.added_at DESC
    `, [customerId]);
    
    res.json({ wishlist: wishlistResult.rows });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to wishlist
app.post('/api/customer/wishlist', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    
    // Check if product exists
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add to wishlist
    await pool.query(`
      INSERT INTO wishlist (customer_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (customer_id, product_id) DO NOTHING
    `, [customerId, product_id]);
    
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from wishlist
app.delete('/api/customer/wishlist/:product_id', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_id } = req.params;
    
    await pool.query(`
      DELETE FROM wishlist WHERE customer_id = $1 AND product_id = $2
    `, [customerId, product_id]);
    
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer loyalty info
app.get('/api/customer/loyalty', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    
    // Get customer loyalty data
    const customerResult = await pool.query(`
      SELECT loyalty_points, loyalty_tier, total_orders, total_spent, average_order_value
      FROM customers WHERE id = $1
    `, [customerId]);
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Get available rewards
    const rewardsResult = await pool.query(`
      SELECT * FROM loyalty_rewards 
      WHERE customer_id = $1 AND is_redeemed = false AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY points_cost ASC
    `, [customerId]);
    
    // Get points history
    const historyResult = await pool.query(`
      SELECT * FROM loyalty_points_history 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [customerId]);
    
    // Calculate tier progress
    const tierProgress = calculateTierProgress(customer.loyalty_points, customer.loyalty_tier);
    
    res.json({
      loyalty: customer,
      rewards: rewardsResult.rows,
      history: historyResult.rows,
      tier_progress: tierProgress
    });
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redeem loyalty reward
app.post('/api/customer/loyalty/redeem', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { reward_id } = req.body;
    
    // Get reward details
    const rewardResult = await pool.query(`
      SELECT * FROM loyalty_rewards WHERE id = $1 AND customer_id = $2
    `, [reward_id, customerId]);
    
    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    const reward = rewardResult.rows[0];
    
    // Check if customer has enough points
    const customerResult = await pool.query(`
      SELECT loyalty_points FROM customers WHERE id = $1
    `, [customerId]);
    
    if (customerResult.rows[0].loyalty_points < reward.points_cost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }
    
    // Redeem reward
    await pool.query(`
      UPDATE loyalty_rewards SET is_redeemed = true, redeemed_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [reward_id]);
    
    // Deduct points
    await pool.query(`
      UPDATE customers SET loyalty_points = loyalty_points - $1 WHERE id = $2
    `, [reward.points_cost, customerId]);
    
    // Add to points history
    await pool.query(`
      INSERT INTO loyalty_points_history (customer_id, points_change, change_type, description)
      VALUES ($1, $2, 'redemption', $3)
    `, [customerId, -reward.points_cost, `Redeemed: ${reward.reward_name}`]);
    
    res.json({ success: true, message: 'Reward redeemed successfully' });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer style profile
app.put('/api/customer/style-profile', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { horror_aesthetic_percentage, pop_culture_percentage, humor_sass_percentage, favorite_colors, preferred_sizes, fit_preference, length_preference } = req.body;
    
    await pool.query(`
      INSERT INTO customer_style_profile (customer_id, horror_aesthetic_percentage, pop_culture_percentage, humor_sass_percentage, favorite_colors, preferred_sizes, fit_preference, length_preference)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (customer_id) 
      DO UPDATE SET 
        horror_aesthetic_percentage = $2,
        pop_culture_percentage = $3,
        humor_sass_percentage = $4,
        favorite_colors = $5,
        preferred_sizes = $6,
        fit_preference = $7,
        length_preference = $8,
        updated_at = CURRENT_TIMESTAMP
    `, [customerId, horror_aesthetic_percentage, pop_culture_percentage, humor_sass_percentage, favorite_colors, preferred_sizes, fit_preference, length_preference]);
    
    res.json({ success: true, message: 'Style profile updated successfully' });
  } catch (error) {
    console.error('Error updating style profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product recommendations for customer
app.get('/api/customer/recommendations', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    
    // Get customer style profile
    const styleProfileResult = await pool.query(`
      SELECT * FROM customer_style_profile WHERE customer_id = $1
    `, [customerId]);
    
    const styleProfile = styleProfileResult.rows[0];
    
    // Get recommendations based on style preferences
    let recommendationsQuery = `
      SELECT * FROM products 
      WHERE is_active = true
    `;
    
    if (styleProfile) {
      // Add style-based filtering
      if (styleProfile.horror_aesthetic_percentage > 50) {
        recommendationsQuery += ` AND category = 'Horror'`;
      } else if (styleProfile.pop_culture_percentage > 50) {
        recommendationsQuery += ` AND category = 'Pop Culture'`;
      } else if (styleProfile.humor_sass_percentage > 50) {
        recommendationsQuery += ` AND category = 'Humor & Sass'`;
      }
    }
    
    recommendationsQuery += ` ORDER BY is_featured DESC, created_at DESC LIMIT 6`;
    
    const recommendationsResult = await pool.query(recommendationsQuery);
    
    res.json({ recommendations: recommendationsResult.rows });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate tier progress
function calculateTierProgress(points, currentTier) {
  const tiers = {
    'Creative Rebel': { min: 0, max: 1000 },
    'Dark Visionary': { min: 1000, max: 2500 },
    'Gothic Master': { min: 2500, max: 5000 },
    'Horror Legend': { min: 5000, max: null }
  };
  
  const tier = tiers[currentTier];
  if (!tier) return { percentage: 0, pointsToNext: 0 };
  
  const progress = tier.max ? Math.min(100, ((points - tier.min) / (tier.max - tier.min)) * 100) : 100;
  const pointsToNext = tier.max ? Math.max(0, tier.max - points) : 0;
  
  return { percentage: Math.round(progress), pointsToNext };
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard API server running on port ${PORT}`);
    console.log(`📧 Email configured: ${process.env.EMAIL_FROM}`);
    console.log(`🗄️ Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`🔐 Admin email: ${process.env.ADMIN_EMAIL}`);
  });
});

module.exports = app; 