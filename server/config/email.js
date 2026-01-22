// Email configuration module
// Dynamically loads nodemailer only when needed

let nodemailer = null;
let nodemailerLoaded = false;

// Function to load nodemailer (only called when needed)
const loadNodemailer = async () => {
  if (nodemailerLoaded) {
    return nodemailer;
  }

  try {
    const nodemailerModule = await import('nodemailer');
    nodemailer = nodemailerModule.default || nodemailerModule;
    nodemailerLoaded = true;
    console.log('✅ nodemailer loaded successfully');
    return nodemailer;
  } catch (error) {
    nodemailerLoaded = true;
    console.warn('⚠️  nodemailer not installed. Email functionality will be disabled.');
    console.warn('   Run: npm install nodemailer');
    console.warn('   Error:', error.message);
    return null;
  }
};

// Create reusable transporter object using SMTP transport
const createTransporter = async () => {
  const mailer = await loadNodemailer();
  
  if (!mailer) {
    throw new Error('nodemailer is not installed. Please run: npm install nodemailer');
  }

  // Check if email credentials are configured
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file');
  }

  // For development/localhost - using Gmail or other SMTP
  // For production - use environment variables
  const transporter = mailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // For Gmail, you might need to use an App Password instead of regular password
    // Enable less secure apps or use App Password: https://support.google.com/accounts/answer/185833
  });

  return transporter;
};

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink, userName = 'User') => ({
    subject: 'Password Reset Request - Hostel Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #4338ca;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .code {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            font-family: monospace;
            word-break: break-all;
            margin: 15px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏠 Hostel Management System</div>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your Hostel Management System account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code">${resetLink}</div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, you can manually navigate to the reset password page and use the token provided below:</p>
            <p style="margin-top: 10px;"><strong>Token:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${resetLink.split('token=')[1]?.split('&')[0] || 'N/A'}</code></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Hostel Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request - Hostel Management System
      
      Hello ${userName},
      
      We received a request to reset your password for your Hostel Management System account.
      
      Click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      This is an automated email. Please do not reply to this message.
    `
  })
};

// Send email function
export const sendEmail = async (to, subject, html, text) => {
  try {
    // Check if nodemailer is installed
    const mailer = await loadNodemailer();
    if (!mailer) {
      console.warn('⚠️  nodemailer not installed. Email functionality disabled.');
      console.warn('   Run: npm install nodemailer');
      return {
        success: false,
        message: 'Email service not available',
        error: 'nodemailer not installed'
      };
    }

    // Check if email is configured
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      console.warn('⚠️  Email not configured. SMTP_USER or SMTP_PASS not set in .env file.');
      console.warn('   Password reset token will be logged instead of sent via email.');
      return {
        success: false,
        message: 'Email not configured',
        error: 'SMTP credentials not set'
      };
    }

    console.log('📧 Attempting to send email...');
    console.log('   To:', to);
    console.log('   SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('   SMTP User:', smtpUser);

    const transporter = await createTransporter();

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    const mailOptions = {
      from: `"Hostel Management System" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and app password in .env file. Make sure you\'re using an App Password, not your regular Gmail password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your SMTP settings (host, port) in .env file.';
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage = 'Invalid email or app password. Please verify your SMTP credentials in .env file.';
    } else if (error.message && error.message.includes('nodemailer')) {
      errorMessage = 'nodemailer is not installed. Please run: npm install nodemailer';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userType, baseUrl, userName = null) => {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}&type=${userType}`;
  const template = emailTemplates.passwordReset(resetLink, userName || 'User');
  
  const result = await sendEmail(email, template.subject, template.html, template.text);
  
  if (!result.success && result.error === 'Email not configured') {
    // Log the token for development
    console.log('\n📧 Password Reset Token (Email not configured):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Token: ${resetToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
  
  return result;
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  emailTemplates
};
