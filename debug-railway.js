// Debug script for Railway - minimal version to isolate the crash
console.log('🚀 RAILWAY DEBUG: Script started');

try {
  console.log('✅ Node.js is running');

  // Test basic requires
  console.log('🔍 Testing dependencies...');
  const express = require('express');
  console.log('✅ Express loaded');

  const cors = require('cors');
  console.log('✅ CORS loaded');

  const { Pool } = require('pg');
  console.log('✅ PostgreSQL loaded');

  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded');

  // Test environment
  console.log('🔍 Testing environment variables...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT || 3000);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('ADMIN_EMAIL exists:', !!process.env.ADMIN_EMAIL);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

  // Test database connection (this might be the issue)
  if (process.env.DATABASE_URL) {
    console.log('🔍 Testing database connection...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    pool.connect()
      .then(() => {
        console.log('✅ Database connection successful');
        pool.end();
        console.log('🎉 All tests passed - server should start!');
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.error('Database URL:', process.env.DATABASE_URL.replace(/:[^:]+@/, ':***@'));
      });
  } else {
    console.log('⚠️ No DATABASE_URL - running without database');
  }

  console.log('🚀 RAILWAY DEBUG: Script completed successfully');

} catch (error) {
  console.error('❌ CRASH DETECTED:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
