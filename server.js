const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadProductImages, uploadImageToCloudinary, deleteImagesFromCloudinary } = require('./cloudinary-upload.js');
require('dotenv').config();

// -----------------------------------------------------------------------------
// Admin credentials bootstrap
// -----------------------------------------------------------------------------
// We keep a single, in-memory, canonical hash so deployments never require
// manually re-generating ADMIN_PASSWORD_HASH. If ADMIN_PASSWORD_HASH is not
// provided, we will hash ADMIN_PASSWORD on startup and use that. This prevents
// frequent invalid-credential issues during redeploys.
let ADMIN_EMAIL_MEMO = null;
let ADMIN_PASSWORD_HASH_MEMO = null;

async function initializeAdminCredentials() {
  try {
    ADMIN_EMAIL_MEMO = process.env.ADMIN_EMAIL || null;

    const envHash = process.env.ADMIN_PASSWORD_HASH;
    const envPassword = process.env.ADMIN_PASSWORD;
    const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';
    const overrideWithPassword = isDevelopment || process.env.ADMIN_OVERRIDE_PASSWORD === 'true';

    if (overrideWithPassword && envPassword && envPassword.length > 0) {
      // Prefer plain password in development or when explicitly overridden
      ADMIN_PASSWORD_HASH_MEMO = await bcrypt.hash(envPassword, 12);
      console.log('🔐 Using ADMIN_PASSWORD (hashed at startup)');
    } else if (envHash && envHash.startsWith('$2')) {
      ADMIN_PASSWORD_HASH_MEMO = envHash;
      console.log('🔐 Using ADMIN_PASSWORD_HASH from environment');
    } else if (envPassword && envPassword.length > 0) {
      ADMIN_PASSWORD_HASH_MEMO = await bcrypt.hash(envPassword, 12);
      console.log('🔐 Generated admin password hash from ADMIN_PASSWORD');
    } else {
      console.warn('⚠️ No ADMIN_PASSWORD_HASH or ADMIN_PASSWORD provided. Admin login will fail until one is set.');
    }
  } catch (err) {
    console.error('❌ Failed to initialize admin credentials:', err);
  }
}

// Fetch active admin password hash. Preference order:
// 1) Database-stored override in admin_settings ('admin_password_hash')
// 2) In-memory memo computed at startup from env
async function getActiveAdminPasswordHash() {
  try {
    if (pool) {
      const result = await pool.query(`
        SELECT value FROM admin_settings WHERE key = 'admin_password_hash' LIMIT 1
      `);
      if (result.rows.length > 0 && result.rows[0].value && result.rows[0].value.startsWith('$2')) {
        return result.rows[0].value;
      }
    }
  } catch (e) {
    console.error('⚠️ Could not read admin password hash from admin_settings:', e.message);
  }
  return ADMIN_PASSWORD_HASH_MEMO;
}

const app = express();
const PORT = process.env.PORT || 3000;
const FEATURE_STATIC_PRODUCT_PAGES = String(process.env.FEATURE_STATIC_PRODUCT_PAGES || 'false').toLowerCase() === 'true';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));
app.use('/public', express.static('public'));
// Removed etsy_images static route - now using Cloudinary for image hosting
app.use('/favicon.ico', express.static('public/favicon.ico'));

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
        password VARCHAR(255),
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

    // Ensure backward compatibility for older databases (add missing columns if needed)
    try {
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE`);
    } catch (error) {
      console.log('Customers: birthday column check failed:', error.message);
    }

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

    // Ensure a unique index on customer_id to support upsert by customer
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_customer_style_profile_customer_id'
        ) THEN
          CREATE UNIQUE INDEX idx_customer_style_profile_customer_id ON customer_style_profile(customer_id);
        END IF;
      END$$;
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

    // Create product_reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(120),
        body TEXT,
        images JSONB,
        status VARCHAR(20) DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (customer_id, product_id)
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
        colors JSON,
        sizes JSON,
        specifications JSON,
        features JSON,
        sub_images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_images JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS size_stock JSON`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_preference TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS feature_rank INTEGER`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specs_notes TEXT`);
    } catch (error) {
      console.log('Some columns may already exist:', error.message);
    }

    // Admin settings key-value store (for admin password hash and flags)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
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
        product_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        size VARCHAR(10),
        color VARCHAR(50),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        size VARCHAR(50) DEFAULT 'M',
        color VARCHAR(50) DEFAULT 'Black',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cart_items table for better cart management
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        size VARCHAR(50) DEFAULT 'M',
        color VARCHAR(50) DEFAULT 'Black',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create custom_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_requests (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        customer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        timeline VARCHAR(100),
        concept_description TEXT NOT NULL,
        style_preferences JSONB,
        product_type VARCHAR(100) NOT NULL,
        quantity VARCHAR(50) NOT NULL,
        size_requirements JSONB,
        color_preferences TEXT,
        budget_range VARCHAR(100) NOT NULL,
        additional_notes TEXT,
        reference_images JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Skip inserting sample products - we want to start fresh
    console.log('📦 Products table initialized - ready for fresh product uploads');

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

// In-memory stores for email-based 2FA and password reset tokens
const twoFactorStore = new Map(); // token -> { email, code, expiresAt }
const passwordResetStore = new Map(); // token -> { email, expiresAt }

function generateNumericCode(length = 6) {
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(0, max + 1);
  return String(num).padStart(length, '0');
}

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    return true;
  } catch (e) {
    console.error('❌ Failed to send email:', e.message);
    return false;
  }
}

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 DEBUG LOGIN ATTEMPT:');
    console.log('Email provided:', email);
    console.log('Password provided:', password ? '[HIDDEN]' : 'undefined');
    console.log('ADMIN_EMAIL (active):', ADMIN_EMAIL_MEMO);
    console.log('Admin hash available (memo):', ADMIN_PASSWORD_HASH_MEMO ? 'Yes' : 'No');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if admin credentials match
    if (email && ADMIN_EMAIL_MEMO && email.toLowerCase() === ADMIN_EMAIL_MEMO.toLowerCase()) {
      console.log('✅ Email matches');
      let isValidPassword = false;

      // Prefer DB-stored admin hash if present
      const activeHash = await getActiveAdminPasswordHash();
      if (activeHash) {
        try {
          isValidPassword = await bcrypt.compare(password, activeHash);
        } catch (e) {
          console.error('❌ Error during bcrypt.compare for admin login:', e.message);
        }
      } else if (ADMIN_PASSWORD_HASH_MEMO) {
        try {
          isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH_MEMO);
        } catch (e) {
          console.error('❌ Error during bcrypt.compare for admin login:', e.message);
        }
      }

      // Fallback: if a plain ADMIN_PASSWORD is provided and hash compare failed,
      // allow direct comparison as an emergency measure to prevent lockouts.
      if (!isValidPassword && process.env.ADMIN_PASSWORD) {
        if (password === process.env.ADMIN_PASSWORD) {
          isValidPassword = true;
          console.warn('⚠️ Using plain ADMIN_PASSWORD fallback. Please set ADMIN_PASSWORD_HASH or keep ADMIN_PASSWORD stable.');
        }
      }

      console.log('🔐 Password check result:', isValidPassword);
      
      if (isValidPassword) {
        // 2FA gate (email OTP) enabled by default unless disabled
        const twoFAEnabled = (process.env.ADMIN_2FA_ENABLED || 'true') !== 'false';
        if (twoFAEnabled) {
          const code = generateNumericCode(6);
          const twoFactorToken = crypto.randomBytes(24).toString('hex');
          const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
          twoFactorStore.set(twoFactorToken, { email, code, expiresAt });

          const toEmail = process.env.ADMIN_2FA_EMAIL || process.env.ADMIN_EMAIL || 'letsgetcreative@myyahoo.com';
          const sent = await sendEmail(
            toEmail,
            'Your Admin 2FA Code',
            `<p>Your login verification code is:</p><p style="font-size:22px;font-weight:bold;letter-spacing:2px;">${code}</p><p>This code expires in 5 minutes.</p>`
          );
          if (!sent) {
            console.warn('⚠️ 2FA email failed to send; denying login');
            return res.status(500).json({ error: 'Failed to send 2FA code' });
          }

          return res.json({ twoFactorRequired: true, twoFactorToken });
        } else {
          const token = jwt.sign(
            { email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
          );

          return res.json({ success: true, token, user: { email, role: 'admin' } });
        }
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

// Verify 2FA code and issue final admin JWT
app.post('/api/admin/2fa/verify', async (req, res) => {
  try {
    const { twoFactorToken, code } = req.body || {};
    if (!twoFactorToken || !code) {
      return res.status(400).json({ error: 'Missing 2FA token or code' });
    }
    const record = twoFactorStore.get(twoFactorToken);
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired 2FA token' });
    }
    if (Date.now() > record.expiresAt) {
      twoFactorStore.delete(twoFactorToken);
      return res.status(400).json({ error: '2FA code expired' });
    }
    if (String(record.code) !== String(code)) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }
    twoFactorStore.delete(twoFactorToken);

    const token = jwt.sign(
      { email: record.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ success: true, token, user: { email: record.email, role: 'admin' } });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request admin password reset (sends a token link/code to email)
app.post('/api/admin/password/request-reset', async (req, res) => {
  try {
    const { email } = req.body || {};
    const targetEmail = process.env.ADMIN_EMAIL;
    if (!email || !targetEmail || email.toLowerCase() !== targetEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    passwordResetStore.set(token, { email: targetEmail, expiresAt });

    const toEmail = process.env.ADMIN_2FA_EMAIL || targetEmail || 'letsgetcreative@myyahoo.com';
    const resetHtml = `<p>You requested an admin password reset.</p>
      <p>Reset token:</p>
      <p style="font-size:14px;word-break:break-all;"><code>${token}</code></p>
      <p>This token expires in 30 minutes.</p>`;
    const sent = await sendEmail(toEmail, 'Admin Password Reset', resetHtml);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send reset email' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Perform admin password reset using token
app.post('/api/admin/password/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Invalid token or password too short' });
    }
    const record = passwordResetStore.get(token);
    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    if (Date.now() > record.expiresAt) {
      passwordResetStore.delete(token);
      return res.status(400).json({ error: 'Token expired' });
    }

    const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10));
    passwordResetStore.delete(token);

    // Persist new hash in DB admin_settings and update in-memory memo
    if (pool) {
      await pool.query(
        `INSERT INTO admin_settings(key, value, updated_at) VALUES('admin_password_hash', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [newHash]
      );
    }
    ADMIN_PASSWORD_HASH_MEMO = newHash;
    res.json({ success: true });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// One-time bootstrap endpoint to set admin password without email (for emergencies)
// Requires ADMIN_BOOTSTRAP_TOKEN to be set in env and provided via header or body
app.post('/api/admin/password/bootstrap', async (req, res) => {
  try {
    const provided = req.headers['x-admin-bootstrap-token'] || (req.body && req.body.bootstrapToken);
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected) {
      return res.status(400).json({ error: 'Bootstrap not configured' });
    }
    if (!provided || String(provided) !== String(expected)) {
      return res.status(403).json({ error: 'Invalid bootstrap token' });
    }
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }
    const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10));
    if (pool) {
      await pool.query(
        `INSERT INTO admin_settings(key, value, updated_at) VALUES('admin_password_hash', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [newHash]
      );
    }
    ADMIN_PASSWORD_HASH_MEMO = newHash;
    res.json({ success: true });
  } catch (err) {
    console.error('Bootstrap set password error:', err);
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
    const { status, limit = 50, offset = 0, q, date_from, date_to } = req.query;

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
    if (q) {
      conditions.push(`(o.order_number ILIKE $${params.length + 1} OR COALESCE(c.name,'') ILIKE $${params.length + 1})`);
      params.push(`%${q}%`);
    }
    if (date_from) {
      conditions.push(`o.created_at >= $${params.length + 1}::timestamp`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`o.created_at < ($${params.length + 1}::date + INTERVAL '1 day')`);
      params.push(date_to);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY o.id, c.name, c.email ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Math.min(parseInt(limit, 10) || 50, 200), parseInt(offset, 10) || 0);

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export orders as CSV for a given period (placed BEFORE :id route to avoid conflicts)
app.get('/api/orders/export', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_export.csv"`);
    return res.send('order_number,status,total_amount,created_at,customer_name\n');
  }
  try {
    const { period = '7d' } = req.query;
    let dateFilter = '';
    switch (period) {
      case '1d': dateFilter = "WHERE o.created_at >= CURRENT_DATE"; break;
      case '7d': dateFilter = "WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'"; break;
      case '30d': dateFilter = "WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'"; break;
      case '90d': dateFilter = "WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'"; break;
      default: dateFilter = "WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'"; break;
    }

    const result = await pool.query(`
      SELECT o.order_number, o.status, o.total_amount, o.created_at,
             COALESCE(c.name, '') AS customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ${dateFilter}
      ORDER BY o.created_at DESC
    `);

    const rows = result.rows;
    const header = ['order_number','status','total_amount','created_at','customer_name'];
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };
    const csv = [header.join(',')]
      .concat(rows.map(r => [r.order_number, r.status, r.total_amount, (r.created_at instanceof Date ? r.created_at.toISOString() : new Date(r.created_at).toISOString()), r.customer_name].map(escape).join(',')))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${period}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('Error exporting orders:', e);
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
    const updated = result.rows[0];

    // Seed a notification on status change (best-effort)
    try {
      await pool.query(`
        INSERT INTO notifications (type, title, body, link, is_read)
        VALUES ($1, $2, $3, $4, false)
      `, [
        'order',
        `Order ${updated.order_number} updated`,
        `Status changed to ${status.toUpperCase()}`,
        `order:${updated.id}`
      ]);
    } catch (e) {
      console.warn('Notification insert failed (non-fatal):', e.message);
    }

    res.json({ order: updated });
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
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, size, color, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [order.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price, item.size, item.color, item.image_url]);
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

// Get all customers (with optional search/pagination)
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 30, offset = 0 } = req.query;
    const params = [];
    let where = '';
    if (q) {
      where = `WHERE (c.email ILIKE $1 OR COALESCE(c.name,'') ILIKE $1)`;
      params.push(`%${q}%`);
    }

    const result = await pool.query(`
      SELECT c.*, 
             COUNT(o.id) as total_orders,
             COALESCE(SUM(o.total_amount),0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${where}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, Math.min(parseInt(limit, 10) || 30, 200), parseInt(offset, 10) || 0]);

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

// Get single custom request by ID
app.get('/api/custom-requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM custom_requests WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error fetching custom request:', error);
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

// Create new custom request
app.post('/api/custom-requests', async (req, res) => {
  try {
    console.log('📝 Custom request received:', req.body);
    
    const {
      fullName,
      email,
      phone,
      timeline,
      concept,
      styles,
      productType,
      quantity,
      sizes,
      colors,
      budget,
      notes,
      referenceImages
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !concept || !productType || !quantity || !budget) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('✅ Required fields validated');

    // Check if database is available
    const dbCheck = checkDatabase();
    console.log('🗄️ Database check:', dbCheck);
    
    if (!dbCheck.available) {
      console.log('⚠️ Database not available, using mock request');
      
      // Create mock custom request object for email
      const mockCustomRequest = {
        id: Date.now(),
        customer_name: fullName,
        email: email,
        phone: phone || null,
        timeline: timeline,
        concept_description: concept,
        style_preferences: styles ? JSON.stringify(styles) : null,
        product_type: productType,
        quantity: quantity,
        size_requirements: sizes ? JSON.stringify(sizes) : null,
        color_preferences: colors || null,
        budget_range: budget,
        additional_notes: notes || null,
        reference_images: referenceImages ? JSON.stringify(referenceImages) : null,
        status: 'pending',
        created_at: new Date()
      };

      console.log('📧 Sending email for mock request...');

      // Send email notification to admin
      try {
        await sendCustomRequestEmail(mockCustomRequest);
        console.log('✅ Email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending custom request email:', emailError);
        // Don't fail the request if email fails
      }

      console.log('✅ Returning mock response');
      return res.status(201).json({ 
        success: true, 
        message: 'Custom request submitted successfully! We\'ll review your submission and get back to you within 24 hours.',
        request: mockCustomRequest 
      });
    }

    console.log('🗄️ Database available, inserting into database...');

    // Insert into database
    const result = await pool.query(`
      INSERT INTO custom_requests (
        customer_name, email, phone, timeline, concept_description, 
        style_preferences, product_type, quantity, size_requirements, 
        color_preferences, budget_range, additional_notes, reference_images, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `, [
      fullName, email, phone || null, timeline, concept,
      styles ? JSON.stringify(styles) : null, productType, quantity,
      sizes ? JSON.stringify(sizes) : null, colors || null, budget,
      notes || null, referenceImages ? JSON.stringify(referenceImages) : null
    ]);

    const customRequest = result.rows[0];
    console.log('✅ Database insert successful');

    // Send email notification to admin
    try {
      await sendCustomRequestEmail(customRequest);
      console.log('✅ Email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending custom request email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('✅ Returning success response');
    res.status(201).json({ 
      success: true, 
      message: 'Custom request submitted successfully! We\'ll review your submission and get back to you within 24 hours.',
      request: customRequest 
    });

  } catch (error) {
    console.error('❌ Error creating custom request:', error);
    console.error('❌ Error stack:', error.stack);
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
      SELECT id AS product_id, name, stock_quantity, low_stock_threshold
      FROM products
      WHERE stock_quantity <= low_stock_threshold AND is_active = true
      ORDER BY stock_quantity ASC
    `);

    // Custom requests count (period-aware)
    const customRequestsCountResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM custom_requests ${dateFilter}
    `);
    
    res.json({
      sales: salesResult.rows[0],
      topProducts: topProductsResult.rows,
      dailySales: dailySalesResult.rows,
      lowStock: lowStockResult.rows,
      customRequestsCount: customRequestsCountResult.rows[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales time series for chart
app.get('/api/analytics/sales-series', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    return res.json({ series: [] });
  }

  try {
    const { period = '7d' } = req.query;
    let numDays = 7;
    switch (period) {
      case '1d': numDays = 1; break;
      case '7d': numDays = 7; break;
      case '30d': numDays = 30; break;
      case '90d': numDays = 90; break;
      default: numDays = 7; break;
    }

    // Build a continuous date series including zero-sale days
    const seriesResult = await pool.query(`
      WITH dates AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '${numDays - 1} days', CURRENT_DATE, INTERVAL '1 day')::date AS date
      )
      SELECT d.date,
             COALESCE(SUM(o.total_amount), 0) AS total
      FROM dates d
      LEFT JOIN orders o ON DATE(o.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    res.json({ series: seriesResult.rows });
  } catch (e) {
    console.error('Error fetching sales series:', e);
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

// =============================================================================
// ORDERS HELPERS
// =============================================================================

// Process all pending orders into processing
app.post('/api/orders/process-all', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) {
    return res.json({ moved: 0 });
  }
  try {
    const result = await pool.query(`
      UPDATE orders
      SET status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending'
      RETURNING id
    `);
    res.json({ moved: result.rowCount });
  } catch (e) {
    console.error('Error processing all orders:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// (duplicate '/api/orders/export' removed; export route is defined earlier, before '/api/orders/:id')

// =============================================================================
// ADMIN ACTIVITY FEED (READ-ONLY)
// =============================================================================

app.get('/api/admin/activity', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) return res.json({ activity: [] });
  try {
    const { limit = 20 } = req.query;

    const orders = await pool.query(`
      SELECT 'order' AS type, order_number AS title, 
             CONCAT('Total $', total_amount) AS subtitle,
             total_amount AS amount, created_at, 
             CONCAT('order:', id) AS link
      FROM orders
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const products = await pool.query(`
      SELECT 'product' AS type, name AS title,
             'New product uploaded' AS subtitle,
             price AS amount, created_at,
             CONCAT('product:', id) AS link
      FROM products
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const lowStock = await pool.query(`
      SELECT 'inventory' AS type, name AS title,
             CONCAT('Low stock: ', stock_quantity, ' remaining') AS subtitle,
             NULL::numeric AS amount, NOW() AS created_at,
             CONCAT('product:', id) AS link
      FROM products
      WHERE stock_quantity <= low_stock_threshold AND is_active = true
      ORDER BY stock_quantity ASC
      LIMIT 20
    `);

    const customReq = await pool.query(`
      SELECT 'custom_request' AS type, customer_name AS title,
             'Custom order request' AS subtitle,
             NULL::numeric AS amount, created_at,
             CONCAT('custom_request:', id) AS link
      FROM custom_requests
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const combined = [...orders.rows, ...products.rows, ...lowStock.rows, ...customReq.rows]
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, Math.min(parseInt(limit, 10) || 20, 100));

    res.json({ activity: combined });
  } catch (e) {
    console.error('Error fetching admin activity:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// NOTIFICATIONS (READ-ONLY + MARK READ)
// =============================================================================

app.get('/api/admin/notifications', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) return res.json({ notifications: [] });
  try {
    const { unread } = req.query;
    const where = unread === 'true' ? 'WHERE is_read = false' : '';
    const result = await pool.query(`
      SELECT id, type, title, body, link, is_read, created_at
      FROM notifications
      ${where}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json({ notifications: result.rows });
  } catch (e) {
    // If table does not exist yet, return empty array safely
    console.warn('Notifications fetch fallback:', e.message);
    res.json({ notifications: [] });
  }
});

app.patch('/api/admin/notifications/read', authenticateToken, async (req, res) => {
  const dbCheck = checkDatabase();
  if (!dbCheck.available) return res.json({ updated: 0 });
  try {
    const result = await pool.query(`
      UPDATE notifications SET is_read = true WHERE is_read = false RETURNING id
    `);
    res.json({ updated: result.rowCount });
  } catch (e) {
    console.warn('Notifications mark-read fallback:', e.message);
    res.json({ updated: 0 });
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

// Send custom request email function
async function sendCustomRequestEmail(customRequest) {
  const customRequestEmailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Custom Design Request - PlwgsCreativeApparel</title>
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
                max-width: 700px;
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
            .request-details {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                margin: 25px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #495057;
            }
            .detail-value {
                color: #333;
                text-align: right;
            }
            .concept-box {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
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
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #6c757d;
            }
            .priority-high {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
            }
            .priority-rush {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎨 New Custom Design Request</h1>
                <p>You have a new custom design request from ${customRequest.customer_name}</p>
            </div>

            <div class="content">
                <div class="request-details ${customRequest.timeline === 'rush' || customRequest.timeline === 'express' ? 'priority-rush' : 'priority-high'}">
                    <h3>📋 Request Details</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Customer Name:</span>
                        <span class="detail-value">${customRequest.customer_name}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${customRequest.email}</span>
                    </div>
                    
                    ${customRequest.phone ? `
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${customRequest.phone}</span>
                    </div>
                    ` : ''}
                    
                    <div class="detail-row">
                        <span class="detail-label">Timeline:</span>
                        <span class="detail-value">${customRequest.timeline}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Product Type:</span>
                        <span class="detail-value">${customRequest.product_type}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${customRequest.quantity}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Budget Range:</span>
                        <span class="detail-value">${customRequest.budget_range}</span>
                    </div>
                    
                    ${customRequest.size_requirements ? `
                    <div class="detail-row">
                        <span class="detail-label">Size Requirements:</span>
                        <span class="detail-value">${JSON.parse(customRequest.size_requirements).join(', ')}</span>
                    </div>
                    ` : ''}
                    
                    ${customRequest.color_preferences ? `
                    <div class="detail-row">
                        <span class="detail-label">Color Preferences:</span>
                        <span class="detail-value">${customRequest.color_preferences}</span>
                    </div>
                    ` : ''}
                    
                    ${customRequest.style_preferences ? `
                    <div class="detail-row">
                        <span class="detail-label">Style Preferences:</span>
                        <span class="detail-value">${JSON.parse(customRequest.style_preferences).join(', ')}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="concept-box">
                    <h4>💡 Design Concept</h4>
                    <p>${customRequest.concept_description}</p>
                </div>

                ${customRequest.additional_notes ? `
                <div class="concept-box">
                    <h4>📝 Additional Notes</h4>
                    <p>${customRequest.additional_notes}</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://plwgscreativeapparel.com/pages/admin.html" class="cta-button">
                        📊 View in Admin Dashboard
                    </a>
                </div>

                <div style="background: #fff3cd; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h4>⏰ Action Required</h4>
                    <p><strong>Please review this request and respond to the customer within 24 hours.</strong></p>
                    <ul style="text-align: left;">
                        <li>Review the design concept and requirements</li>
                        <li>Prepare a detailed quote</li>
                        <li>Send initial mockup or concept sketches</li>
                        <li>Set up timeline and milestones</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p><strong>PlwgsCreativeApparel</strong></p>
                <p>Custom Design Request - ID: ${customRequest.id}</p>
                <p>Submitted: ${new Date(customRequest.created_at).toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🎨 New Custom Design Request from ${customRequest.customer_name}`,
    html: customRequestEmailHTML
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Custom request email sent to admin for request ${customRequest.id}`);
  } catch (error) {
    console.error(`❌ Error sending custom request email:`, error);
  }
}

// Get all subscribers (admin endpoint)
app.get('/api/subscribers', authenticateToken, async (req, res) => {
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
        INSERT INTO customers (email, password, first_name, last_name, name)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [email, hashedPassword, first_name, last_name, `${first_name} ${last_name}`]);

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

      // Check hashed password
      const isValidPassword = await bcrypt.compare(password, customer.rows[0].password);
      if (!isValidPassword) {
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
    
    // Update customer info (preserve existing values when null/undefined)
    await pool.query(`
      UPDATE customers 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        birthday = COALESCE($4, birthday),
        name = CASE 
          WHEN $1 IS NOT NULL OR $2 IS NOT NULL THEN CONCAT(COALESCE($1, ''), ' ', COALESCE($2, ''))
          ELSE name
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [first_name ?? null, last_name ?? null, phone ?? null, birthday ?? null, customerId]);
    
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

// Get a specific customer order with items and review flags
app.get('/api/customer/orders/:id', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    // Fetch order and ensure ownership
    const orderResult = await pool.query(`
      SELECT * FROM orders WHERE id = $1 AND customer_id = $2
    `, [id, customerId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderResult.rows[0];

    // Items
    const itemsResult = await pool.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [id]);
    const items = itemsResult.rows;

    // Reviews by product for this customer
    const productIds = items.map(i => i.product_id).filter(Boolean);
    let reviewsByProduct = {};
    if (productIds.length > 0) {
      const r = await pool.query(`
        SELECT product_id, id, rating, status
        FROM product_reviews
        WHERE customer_id = $1 AND product_id = ANY($2::int[])
      `, [customerId, productIds]);
      for (const row of r.rows) {
        reviewsByProduct[row.product_id] = { id: row.id, rating: row.rating, status: row.status };
      }
    }

    res.json({ order, items, reviewsByProduct });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a product review by a customer
app.post('/api/customer/reviews', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_id, order_id, rating, title, body, images } = req.body || {};

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'product_id and rating are required' });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    // If order_id provided, verify ownership and product inclusion
    if (order_id) {
      const ownOrder = await pool.query(`SELECT 1 FROM orders WHERE id = $1 AND customer_id = $2`, [order_id, customerId]);
      if (ownOrder.rows.length === 0) {
        return res.status(403).json({ error: 'Order does not belong to customer' });
      }
      const hasProduct = await pool.query(`SELECT 1 FROM order_items WHERE order_id = $1 AND product_id = $2`, [order_id, product_id]);
      if (hasProduct.rows.length === 0) {
        return res.status(400).json({ error: 'Product not found in given order' });
      }
    }

    // Upsert one review per product per customer
    const upsert = await pool.query(`
      INSERT INTO product_reviews (product_id, customer_id, order_id, rating, title, body, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (customer_id, product_id)
      DO UPDATE SET
        order_id = EXCLUDED.order_id,
        rating = EXCLUDED.rating,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        images = EXCLUDED.images,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [product_id, customerId, order_id || null, rating, title || null, body || null, images ? JSON.stringify(images) : null]);

    res.json({ success: true, id: upsert.rows[0].id });
  } catch (error) {
    if (error && error.code === '23514') { // CHECK violation
      return res.status(400).json({ error: 'Invalid rating' });
    }
    console.error('Error creating review:', error);
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

// CART MANAGEMENT ENDPOINTS
// =============================================================================

// Get customer's cart
app.get('/api/cart', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.json({ items: [] });
  }

  try {
    const customerId = req.customer.id;
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.product_id,
        c.product_name,
        c.quantity,
        c.unit_price,
        c.size,
        c.color,
        c.image_url,
        (c.quantity * c.unit_price) as total_price
      FROM cart c
      WHERE c.customer_id = $1
      ORDER BY c.created_at DESC
    `, [customerId]);

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
app.post('/api/cart/add', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const customerId = req.customer.id;
    const { product_name, quantity, size, color, image_url } = req.body;

    // Look up product ID, price, and image by name
    const productResult = await pool.query(`
      SELECT id, price, image_url FROM products WHERE name = $1
    `, [product_name]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product_id = productResult.rows[0].id;
    const unit_price = productResult.rows[0].price;
    const product_image_url = productResult.rows[0].image_url;

    // Check if item already exists in cart
    const existingItem = await pool.query(`
      SELECT id, quantity FROM cart 
      WHERE customer_id = $1 AND product_id = $2 AND size = $3 AND color = $4
    `, [customerId, product_id, size || 'M', color || 'Black']);

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + (quantity || 1);
      await pool.query(`
        UPDATE cart 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [newQuantity, existingItem.rows[0].id]);

      res.json({ message: 'Cart updated', item: { id: existingItem.rows[0].id, quantity: newQuantity } });
    } else {
      // Add new item
      const result = await pool.query(`
        INSERT INTO cart (customer_id, product_id, product_name, quantity, unit_price, size, color, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [customerId, product_id, product_name, quantity || 1, unit_price, size || 'M', color || 'Black', product_image_url]);

      res.json({ message: 'Item added to cart', item: result.rows[0] });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
app.put('/api/cart/update/:id', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const customerId = req.customer.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await pool.query(`
        DELETE FROM cart WHERE id = $1 AND customer_id = $2
      `, [cartItemId, customerId]);

      res.json({ message: 'Item removed from cart' });
    } else {
      // Update quantity
      const result = await pool.query(`
        UPDATE cart 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 AND customer_id = $3
        RETURNING *
      `, [quantity, cartItemId, customerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json({ message: 'Cart updated', item: result.rows[0] });
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
app.delete('/api/cart/remove/:id', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const customerId = req.customer.id;
    const cartItemId = req.params.id;

    const result = await pool.query(`
      DELETE FROM cart WHERE id = $1 AND customer_id = $2
    `, [cartItemId, customerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear customer's cart
app.delete('/api/cart/clear', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const customerId = req.customer.id;

    await pool.query(`
      DELETE FROM cart WHERE customer_id = $1
    `, [customerId]);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Get all products (public endpoint for admin uploads page)
app.get('/api/products/public', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const result = await pool.query(`
      SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID (public endpoint for product detail pages)
app.get('/api/products/public/:id', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const productId = req.params.id;
    const result = await pool.query(`
      SELECT * FROM products WHERE id = $1 AND is_active = true
    `, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];

    // Reviews aggregate and items for public display
    const agg = await pool.query(`
      SELECT COUNT(*)::int AS count, COALESCE(AVG(rating),0)::float AS average
      FROM product_reviews
      WHERE product_id = $1 AND status = 'approved'
    `, [productId]);
    const { count, average } = agg.rows[0] || { count: 0, average: 0 };

    const itemsResult = await pool.query(`
      SELECT pr.id, pr.rating, pr.title, pr.body, pr.created_at,
             c.first_name, c.last_name, c.name AS full_name, c.email,
             a.first_name AS addr_first_name, a.last_name AS addr_last_name,
             CASE 
               WHEN COALESCE(NULLIF(TRIM(c.first_name), ''), NULLIF(TRIM(a.first_name), '')) IS NOT NULL
                 OR COALESCE(NULLIF(TRIM(c.last_name), ''), NULLIF(TRIM(a.last_name), '')) IS NOT NULL
                 THEN CONCAT(
                      COALESCE(NULLIF(TRIM(c.first_name), ''), NULLIF(TRIM(a.first_name), '')), ' ',
                      LEFT(COALESCE(NULLIF(TRIM(c.last_name), ''), NULLIF(TRIM(a.last_name), '')), 1)
                 )
               WHEN COALESCE(NULLIF(TRIM(c.name), ''), '') <> '' THEN c.name
               WHEN c.email IS NOT NULL AND POSITION('@' IN c.email) > 1 THEN SPLIT_PART(c.email, '@', 1)
               ELSE 'Customer'
             END AS display_name
      FROM product_reviews pr
      LEFT JOIN customers c ON pr.customer_id = c.id
      LEFT JOIN customer_addresses a ON a.customer_id = c.id AND a.is_default = true
      WHERE pr.product_id = $1 AND pr.status = 'approved'
      ORDER BY pr.created_at DESC
      LIMIT 20 OFFSET 0
    `, [productId]);

    res.json({ product, reviews: { count, average, items: itemsResult.rows } });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get homepage hero products (up to 3, ordered by feature_rank)
app.get('/api/products/hero', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM products 
      WHERE is_active = true AND feature_rank IS NOT NULL
      ORDER BY feature_rank ASC
      LIMIT 3
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hero products:', error);
    res.status(500).json({ error: 'Failed to fetch hero products' });
  }
});

// Set or clear a product's hero feature (admin)
app.put('/api/admin/products/:id/feature', authenticateToken, async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database not available' });
  const productId = req.params.id;
  const { in_hero, rank } = req.body || {};
  try {
    await pool.query('BEGIN');
    if (in_hero && [1,2,3].includes(Number(rank))) {
      // Clear any existing product at this rank
      await pool.query('UPDATE products SET feature_rank = NULL WHERE feature_rank = $1', [rank]);
      // Set this product's rank and mark featured
      await pool.query('UPDATE products SET feature_rank = $1, is_featured = true WHERE id = $2', [rank, productId]);
    } else {
      // Clear hero flag for this product
      await pool.query('UPDATE products SET feature_rank = NULL WHERE id = $1', [productId]);
    }
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating product hero feature:', error);
    res.status(500).json({ error: 'Failed to update hero feature' });
  }
});
// Search product by name
app.get('/api/products/search', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await pool.query(`
      SELECT * FROM products WHERE name = $1
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error searching product:', error);
    res.status(500).json({ error: 'Failed to search product' });
  }
});

// Admin Product Management Endpoints
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const result = await pool.query(`
      SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
app.get('/api/admin/products/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const productId = req.params.id;
    const result = await pool.query(`
      SELECT * FROM products WHERE id = $1 AND is_active = true
    `, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const {
      name,
      description,
      price,
      original_price,
      category,
      stock_quantity,
      low_stock_threshold,
      sale_percentage,
      tags,
      colors,
      sizes,
      images,
      specifications,
      features
    } = req.body;

    // Process tags to ensure it's always a JavaScript array
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === 'string') {
      // Try to parse as JSON first (in case it's a JSON string)
      try {
        const parsedTags = JSON.parse(tags);
        if (Array.isArray(parsedTags)) {
          processedTags = parsedTags;
        } else {
          // If not an array, treat as comma-separated string
          processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
    }

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    // Get the next sequential ID
    const nextIdResult = await pool.query(`
      SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products
    `);
    const nextId = nextIdResult.rows[0].next_id;

    // Handle image uploads to Cloudinary
    let image_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik0yNSAyNUg3NVY3NUgyNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0zNSA0NUw2NSA0NU02NSA2NUwzNSA2NUwzNSA0NVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
    let sub_images = [];
    
    console.log('🔍 DEBUG: Received images data:', JSON.stringify(images, null, 2));
    
    if (images && images.length > 0) {
      try {
        console.log(`☁️ Uploading ${images.length} images to Cloudinary for product: ${name}`);
        console.log('🔍 DEBUG: First image structure:', JSON.stringify(images[0], null, 2));
        
        // Upload images to Cloudinary
        const uploadedUrls = await uploadProductImages(images, name);
        
        if (uploadedUrls.mainImage) {
          image_url = uploadedUrls.mainImage;
          console.log(`✅ Main image uploaded to Cloudinary: ${image_url}`);
        }
        
        if (uploadedUrls.subImages.length > 0) {
          sub_images = uploadedUrls.subImages;
          console.log(`✅ ${sub_images.length} sub images uploaded to Cloudinary`);
        }
        
        console.log(`🎉 All images uploaded successfully to Cloudinary for product: ${name}`);
      } catch (imageError) {
        console.error('❌ Error uploading images to Cloudinary:', imageError);
        // Continue without images if there's an error
        console.log('⚠️ Continuing product creation without images');
      }
    } else {
      console.log('⚠️ No images provided for upload');
    }

    // Insert product with sequential ID
    console.log(`💾 Inserting product into database: ID ${nextId}, Name: ${name}`);
    
    // Collect size stock quantities from the request (sanitize: remove XS)
    const sizeStockRaw = req.body.size_stock || {};
    const sizeStock = Object.fromEntries(Object.entries(sizeStockRaw).filter(([k]) => k !== 'XS'));
    // Sanitize sizes: ensure array and drop XS
    const sizesArray = Array.isArray(sizes) ? sizes : [];
    const sizesFiltered = sizesArray.filter(s => s !== 'XS');
    
    const result = await pool.query(`
      INSERT INTO products (
        id, name, description, price, original_price, image_url, category, subcategory, 
        tags, stock_quantity, low_stock_threshold, is_featured, is_on_sale, sale_percentage,
        colors, sizes, specifications, features, sub_images, size_stock,
        track_inventory, brand_preference, specs_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `, [
      nextId, name, description, price, original_price, image_url, category, 'Featured',
      processedTags, stock_quantity || 50, low_stock_threshold || 5,
      true, true, sale_percentage || 15, JSON.stringify(colors || []), 
      JSON.stringify(sizesFiltered), JSON.stringify(specifications || {}),
      JSON.stringify(features || {}), JSON.stringify(sub_images), JSON.stringify(sizeStock),
      !!req.body.track_inventory, req.body.brand_preference || 'either', req.body.specs_notes || ''
    ]);

    console.log(`✅ Product created with ID ${nextId}`);

    // Create edit page for the new product
    try {
      const { createEditPageForProduct } = require('./create_edit_page_for_product.js');
      const editPageCreated = createEditPageForProduct(nextId, name);
      
      if (editPageCreated) {
        console.log(`✅ Edit page created for product ${nextId}`);
      } else {
        console.log(`⚠️ Failed to create edit page for product ${nextId}`);
      }
    } catch (editPageError) {
      console.error('❌ Error creating edit page:', editPageError);
      console.log('⚠️ Continuing without edit page creation');
    }

    // Optionally generate static product page (feature-flagged)
    if (FEATURE_STATIC_PRODUCT_PAGES) {
      try {
        const { buildStaticProductPage } = require('./tools/static_product_builder');
        await buildStaticProductPage(result.rows[0]);
        console.log(`🧱 Static product page generated for ID ${nextId}`);
      } catch (e) {
        console.error('❌ Static page build failed:', e.message || e);
      }
    }

    res.json({ message: 'Product created successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      original_price,
      category,
      stock_quantity,
      low_stock_threshold,
      sale_percentage,
      tags,
      colors,
      sizes,
      size_stock,
      images,
      image_url,
      sub_images,
      specifications,
      features
    } = req.body;

    // Process tags to ensure it's always a JavaScript array
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags;
    } else if (typeof tags === 'string') {
      // Try to parse as JSON first (in case it's a JSON string)
      try {
        const parsedTags = JSON.parse(tags);
        if (Array.isArray(parsedTags)) {
          processedTags = parsedTags;
        } else {
          // If not an array, treat as comma-separated string
          processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
      } catch (e) {
        // If JSON parsing fails, treat as comma-separated string
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      }
    }

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    // Handle image uploads to Cloudinary
    let final_image_url = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik0yNSAyNUg3NVY3NUgyNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0zNSA0NUw2NSA0NU02NSA2NUwzNSA2NUwzNSA0NVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
    let final_sub_images = [];
    
    // Handle images from client. Supports three cases:
    // 1) images: array of objects { data } (legacy create flow)
    // 2) images: array of strings: either data URLs (base64) or http(s) URLs (mixed)
    // 3) image_url + sub_images: keep existing URLs
    let processedMixedImages = null; // when provided via 'images'

    if (Array.isArray(images) && images.length > 0) {
      console.log(`📸 Received ${images.length} images from client for processing`);
      processedMixedImages = [];

      for (let i = 0; i < Math.min(images.length, 5); i += 1) {
        const item = images[i];
        try {
          // Case A: object with .data (base64)
          if (item && typeof item === 'object' && typeof item.data === 'string') {
            const url = await uploadImageToCloudinary(item.data, name, i + 1, i === 0);
            processedMixedImages.push(url);
            continue;
          }
          // Case B: string data URL (base64) → upload
          if (typeof item === 'string' && item.startsWith('data:')) {
            const url = await uploadImageToCloudinary(item, name, i + 1, i === 0);
            processedMixedImages.push(url);
            continue;
          }
          // Case C: string http(s) URL → keep as-is
          if (typeof item === 'string' && /^https?:\/\//i.test(item)) {
            processedMixedImages.push(item);
            continue;
          }
        } catch (uErr) {
          console.error(`❌ Failed processing image index ${i}:`, uErr?.message || uErr);
        }
      }

      // Apply processed images if at least one valid
      if (processedMixedImages.length > 0) {
        final_image_url = processedMixedImages[0] || final_image_url;
        final_sub_images = processedMixedImages.slice(1);
        console.log(`✅ Final images prepared from mixed payload. main=${final_image_url}, subs=${final_sub_images.length}`);
      } else {
        console.warn('⚠️ No valid images processed from payload; retaining existing image_url/sub_images');
      }
    } else if (image_url || (sub_images && sub_images.length > 0)) {
      // Existing images (URL format) - keep them as is
      if (image_url && !image_url.startsWith('data:')) {
        final_image_url = image_url;
        console.log(`✅ Keeping existing main image: ${final_image_url}`);
      }
      if (sub_images && Array.isArray(sub_images)) {
        final_sub_images = sub_images.filter(img => img && !img.startsWith('data:'));
        console.log(`✅ Keeping ${final_sub_images.length} existing sub images`);
      }
    }

    // Update product
    const result = await pool.query(`
      UPDATE products SET
        name = $1, description = $2, price = $3, original_price = $4, 
        image_url = $5, category = $6, tags = $7, stock_quantity = $8,
        low_stock_threshold = $9, sale_percentage = $10, colors = $11,
        sizes = $12, specifications = $13, features = $14, sub_images = $15,
        size_stock = $16, track_inventory = $17, brand_preference = $18, specs_notes = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *
    `, [
      name, description, price, original_price, final_image_url, category,
      processedTags, stock_quantity || 50, low_stock_threshold || 5,
      sale_percentage || 15, JSON.stringify(colors || []), JSON.stringify((Array.isArray(sizes) ? sizes.filter(s => s !== 'XS') : [])),
      JSON.stringify(specifications || {}), JSON.stringify(features || {}),
      JSON.stringify(final_sub_images), JSON.stringify(size_stock || {}),
      !!req.body.track_inventory, req.body.brand_preference || 'either', req.body.specs_notes || '',
      productId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update edit page if product name changed
    try {
      const { createEditPageForProduct } = require('./create_edit_page_for_product.js');
      const editPageCreated = createEditPageForProduct(productId, name);
      
      if (editPageCreated) {
        console.log(`✅ Edit page updated for product ${productId} with new name: ${name}`);
      } else {
        console.log(`⚠️ Failed to update edit page for product ${productId}`);
      }
    } catch (editPageError) {
      console.error('❌ Error updating edit page:', editPageError);
      console.log('⚠️ Continuing without edit page update');
    }

    // Optionally regenerate static product page (feature-flagged)
    if (FEATURE_STATIC_PRODUCT_PAGES) {
      try {
        const { buildStaticProductPage } = require('./tools/static_product_builder');
        await buildStaticProductPage(result.rows[0]);
        console.log(`🧱 Static product page regenerated for ID ${productId}`);
      } catch (e) {
        console.error('❌ Static page rebuild failed:', e.message || e);
      }
    }

    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const productId = req.params.id;

    // Check if product exists and get image URLs
    const checkResult = await pool.query(`
      SELECT id, image_url, sub_images FROM products WHERE id = $1
    `, [productId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = checkResult.rows[0];
    
    // Collect all image URLs for deletion from Cloudinary
    const imageUrlsToDelete = [];
    if (product.image_url && !product.image_url.startsWith('data:')) {
      imageUrlsToDelete.push(product.image_url);
    }
    
    if (product.sub_images && Array.isArray(product.sub_images)) {
      product.sub_images.forEach(url => {
        if (url && !url.startsWith('data:')) {
          imageUrlsToDelete.push(url);
        }
      });
    }
    
    // Delete images from Cloudinary
    if (imageUrlsToDelete.length > 0) {
      try {
        await deleteImagesFromCloudinary(imageUrlsToDelete);
        console.log(`✅ Deleted ${imageUrlsToDelete.length} images from Cloudinary`);
      } catch (error) {
        console.error('❌ Error deleting images from Cloudinary:', error);
      }
    }

    // Soft-delete: mark product inactive to preserve order history
    await pool.query(`
      UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [productId]);

    console.log(`✅ Product ${productId} archived (soft-deleted) successfully`);

    // Delete edit page for the product
    const editPagePattern = `product-edit-product-${productId}_*.html`;
    const pagesDir = path.join(__dirname, 'pages');
    
    try {
      const files = fs.readdirSync(pagesDir);
      const editPageFile = files.find(file => file.startsWith(`product-edit-product-${productId}_`));
      
      if (editPageFile) {
        const editPagePath = path.join(pagesDir, editPageFile);
        fs.unlinkSync(editPagePath);
        console.log(`✅ Deleted edit page: ${editPageFile}`);
      }
    } catch (error) {
      console.log(`⚠️ Error deleting edit page for product ${productId}:`, error.message);
    }

    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Checkout - convert cart to order
app.post('/api/cart/checkout', authenticateCustomer, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    const customerId = req.customer.id;
    const { shipping_address } = req.body;

    // Get customer info
    const customerResult = await pool.query(`
      SELECT id, email, first_name, last_name FROM customers WHERE id = $1
    `, [customerId]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customerResult.rows[0];

    // Get cart items
    const cartResult = await pool.query(`
      SELECT * FROM cart WHERE customer_id = $1
    `, [customerId]);

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult.rows;
    const total_amount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Generate order number
    const orderNumber = 'PLW-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);

    // Create order
    const orderResult = await pool.query(`
      INSERT INTO orders (order_number, customer_id, customer_email, customer_name, total_amount, shipping_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [orderNumber, customerId, customer.email, `${customer.first_name} ${customer.last_name}`, total_amount, shipping_address]);

    const order = orderResult.rows[0];

    // Create order items from cart items
    for (const item of cartItems) {
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, size, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [order.id, item.product_id, item.product_name, item.quantity, item.unit_price, (item.quantity * item.unit_price), item.size, item.color]);
    }

    // Clear cart after successful order
    await pool.query(`
      DELETE FROM cart WHERE customer_id = $1
    `, [customerId]);

    // Update customer stats
    await pool.query(`
      UPDATE customers 
      SET total_orders = total_orders + 1,
          total_spent = total_spent + $1,
          average_order_value = (total_spent + $1) / (total_orders + 1),
          loyalty_points = loyalty_points + FLOOR($1 * 0.1)
      WHERE id = $2
    `, [total_amount, customerId]);

    res.json({ 
      message: 'Order created successfully', 
      order: order,
      orderNumber: orderNumber
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// Initialize database and start server
Promise.all([
  initializeAdminCredentials(),
  initializeDatabase()
]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Admin Dashboard API server running on port ${PORT}`);
    console.log(`📧 Email configured: ${process.env.EMAIL_FROM}`);
    console.log(`🗄️ Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`🔐 Admin email: ${ADMIN_EMAIL_MEMO}`);
  });
});

module.exports = app; 