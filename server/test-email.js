// Quick test script to check email configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('📧 Email Configuration Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check nodemailer
try {
  const nodemailer = await import('nodemailer');
  console.log('✅ nodemailer is installed\n');
} catch (error) {
  console.log('❌ nodemailer is NOT installed');
  console.log('   Run: npm install nodemailer\n');
  process.exit(1);
}

// Check environment variables
console.log('Environment Variables:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT || '587';
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

console.log(`SMTP_HOST: ${smtpHost ? '✅ ' + smtpHost : '❌ Not set'}`);
console.log(`SMTP_PORT: ${smtpPort ? '✅ ' + smtpPort : '❌ Not set'}`);
console.log(`SMTP_USER: ${smtpUser ? '✅ ' + smtpUser : '❌ Not set'}`);
console.log(`SMTP_PASS: ${smtpPass ? '✅ ' + '*'.repeat(smtpPass.length) : '❌ Not set'}`);
console.log(`FRONTEND_URL: ${frontendUrl ? '✅ ' + frontendUrl : '❌ Not set'}`);
console.log('');

// Test connection
if (smtpUser && smtpPass) {
  console.log('Testing SMTP Connection...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log('   Email configuration is working correctly.\n');
  } catch (error) {
    console.log('❌ SMTP connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Solution:');
      console.log('   - Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('   - Generate a new App Password: https://myaccount.google.com/apppasswords');
      console.log('   - Make sure 2-Step Verification is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Solution:');
      console.log('   - Check your SMTP_HOST and SMTP_PORT settings');
      console.log('   - Make sure your firewall allows port 587');
    }
    console.log('');
  }
} else {
  console.log('⚠️  Cannot test connection - SMTP credentials not set\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

