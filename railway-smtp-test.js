const nodemailer = require('nodemailer');
require('dotenv').config();

async function testRailwaySMTP() {
  console.log('🔍 Testing SMTP from Railway Environment...');
  
  // Test current Zoho config
  const zohoTransporter = nodemailer.createTransporter({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'admin@plwgscreativeapparel.com',
      pass: process.env.SMTP_PASSWORD || '1heyh4jdk1AY'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  // Test alternative Zoho config
  const zohoAltTransporter = nodemailer.createTransporter({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'admin@plwgscreativeapparel.com',
      pass: process.env.SMTP_PASSWORD || '1heyh4jdk1AY'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  // Test Gmail (as baseline)
  const gmailTransporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@gmail.com',
      pass: 'testpass'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const tests = [
    { name: 'Zoho Port 465', transporter: zohoTransporter },
    { name: 'Zoho Port 587', transporter: zohoAltTransporter },
    { name: 'Gmail Port 587', transporter: gmailTransporter }
  ];

  for (const test of tests) {
    console.log(`\n🧪 Testing ${test.name}...`);
    try {
      await test.transporter.verify();
      console.log(`✅ ${test.name}: Connection successful!`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

testRailwaySMTP().catch(console.error);
