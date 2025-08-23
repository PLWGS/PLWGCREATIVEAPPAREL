const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: 'test@example.com', // Sending to a dummy address
    subject: 'Test Email from PLWGCREATIVEAPPAREL',
    text: 'This is a test email to verify the SMTP configuration.'
  };

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

testEmail();
