require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Checking Zoho Email Configuration...');
console.log('=====================================');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('=====================================');

// Test email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Test 1: Verify SMTP connection
async function testConnection() {
  console.log('\n🔌 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.log('❌ SMTP connection failed:', error.message);
    return false;
  }
}

// Test 2: Send test email
async function sendTestEmail() {
  console.log('\n📧 Sending test email...');
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Send to yourself
    subject: '🧪 Zoho Email Test - PLWGCREATIVEAPPAREL',
    html: `
      <h2>🎉 Zoho Email Configuration Test Successful!</h2>
      <p>This email confirms that your Zoho email integration is working correctly.</p>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>SMTP Host: ${process.env.SMTP_HOST}</li>
        <li>SMTP Port: ${process.env.SMTP_PORT}</li>
        <li>SMTP Secure: ${process.env.SMTP_SECURE}</li>
        <li>From: ${process.env.EMAIL_FROM}</li>
        <li>Sent at: ${new Date().toLocaleString()}</li>
      </ul>
      <p>✅ Your email system is ready for production use!</p>
    `,
    text: `Zoho Email Test Successful! Your email configuration is working correctly. Sent at ${new Date().toLocaleString()}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email sent to:', mailOptions.to);
    return true;
  } catch (error) {
    console.log('❌ Failed to send test email:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Zoho Email Configuration Tests...\n');
  
  const connectionTest = await testConnection();
  
  if (connectionTest) {
    await sendTestEmail();
  } else {
    console.log('\n⚠️  Skipping email send test due to connection failure');
  }
  
  console.log('\n🏁 Email configuration tests completed!');
}

// Run the tests
runAllTests().catch(console.error); 